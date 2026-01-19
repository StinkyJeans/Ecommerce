import { NextResponse } from "next/server";
import nodemailer from 'nodemailer';

export async function GET(req) {
  // For easier testing, allow GET with email query parameter
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ 
      message: 'Email parameter required',
      usage: 'GET /api/test-email?email=your-email@example.com',
      or: 'POST /api/test-email with JSON body: { "email": "your-email@example.com" }',
      example: '/api/test-email?email=test@example.com'
    });
  }

  // Reuse POST logic
  return POST(new Request(req.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  }));
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('=== TEST EMAIL DEBUG ===');
    console.log('Email to send to:', email);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('SMTP_USER present:', !!process.env.SMTP_USER);
    console.log('SMTP_PASS present:', !!process.env.SMTP_PASS);
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'noreply@example.com');
    console.log('EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME || 'Your Store');

    const fromEmail = process.env.EMAIL_FROM || 'noreply@example.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Your Store';

    // Determine which transporter to use
    let transporter;
    let isEthereal = false;

    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;

    if (isDevelopment && !hasSmtpConfig) {
      // Use Ethereal
      console.log('Using Ethereal test account (development mode)');
      isEthereal = true;
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('Ethereal test account created');
      console.log('Preview emails at: https://ethereal.email');
    } else {
      // Use SMTP
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return NextResponse.json({ 
          error: 'SMTP configuration missing',
          details: 'Set SMTP_USER and SMTP_PASS in .env.local (or use Ethereal in development)',
          instructions: [
            'Development: Leave SMTP_USER and SMTP_PASS empty to use Ethereal',
            'Production: Set SMTP_USER and SMTP_PASS for Gmail or other SMTP server'
          ]
        }, { status: 500 });
      }

      console.log('Using SMTP configuration');
      console.log('SMTP Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
      console.log('SMTP Port:', process.env.SMTP_PORT || '587');
      console.log('SMTP User:', process.env.SMTP_USER);

      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Verify connection
      try {
        await transporter.verify();
        console.log('SMTP connection verified successfully');
      } catch (error) {
        console.error('SMTP connection verification failed:', error);
        return NextResponse.json({ 
          error: 'SMTP connection failed',
          details: error.message,
          instructions: [
            'Check your SMTP credentials',
            'For Gmail: Enable 2-step verification and create an App Password',
            'See NODEMAILER_SETUP.md for detailed instructions'
          ]
        }, { status: 500 });
      }
    }

    console.log('Sending email with Nodemailer...');
    console.log('From:', `${fromName} <${fromEmail}>`);
    console.log('To:', email);

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: 'Test Email from Your Store',
      html: '<h1>Test Email</h1><p>If you received this, Nodemailer is working correctly!</p><p>Time: ' + new Date().toISOString() + '</p>',
      text: 'Test Email\n\nIf you received this, Nodemailer is working correctly!\n\nTime: ' + new Date().toISOString()
    });

    const messageId = info.messageId;
    let previewUrl = null;

    if (isEthereal) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('Preview URL:', previewUrl);
      }
    }

    console.log('Email sent successfully! Message ID:', messageId);
    console.log('=== END TEST EMAIL DEBUG ===');

    const response = {
      success: true,
      messageId: messageId,
      message: isEthereal 
        ? 'Test email sent successfully! Check Ethereal preview URL below.'
        : 'Test email sent successfully! Check your inbox (and spam folder).',
      mode: isEthereal ? 'Ethereal (Development)' : 'SMTP (Production)'
    };

    if (previewUrl) {
      response.previewUrl = previewUrl;
      response.instructions = [
        '1. Click the preview URL above to view the email',
        '2. Emails in Ethereal are captured for testing (not actually sent)',
        '3. For production, configure SMTP_USER and SMTP_PASS'
      ];
    } else {
      response.instructions = [
        '1. Check your email inbox (and spam folder)',
        '2. If using Gmail, check spam folder as sender may not be verified',
        '3. Monitor email delivery in your SMTP provider dashboard'
      ];
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
