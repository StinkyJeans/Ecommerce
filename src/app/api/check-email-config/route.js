import { NextResponse } from "next/server";

export async function GET(req) {
  const emailFrom = process.env.EMAIL_FROM || 'noreply@example.com';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasSmtpConfig = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  const willUseEthereal = isDevelopment && !hasSmtpConfig;
  
  const warnings = [];
  const instructions = [];
  
  if (willUseEthereal) {
    instructions.push(
      '✅ Development mode: Will use Ethereal (no configuration needed)',
      '📧 Emails will be captured at: https://ethereal.email',
      '📧 Preview URLs will be shown in console logs',
      '💡 For production, configure SMTP_USER and SMTP_PASS'
    );
  } else if (hasSmtpConfig) {
    instructions.push(
      '✅ SMTP configuration detected',
      '📧 Will use SMTP server for sending emails',
      'Test email: /api/test-email?email=your-email@example.com'
    );
    
    if (!process.env.SMTP_HOST) {
      warnings.push('SMTP_HOST not set, defaulting to smtp.gmail.com');
    }
    if (!process.env.SMTP_PORT) {
      warnings.push('SMTP_PORT not set, defaulting to 587');
    }
  } else {
    warnings.push('SMTP configuration missing');
    instructions.push(
      'Development: Leave SMTP_USER and SMTP_PASS empty to use Ethereal',
      'Production: Set SMTP_USER and SMTP_PASS for Gmail or other SMTP server',
      'See NODEMAILER_SETUP.md for detailed setup instructions'
    );
  }
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    mode: willUseEthereal ? 'Ethereal (Development)' : hasSmtpConfig ? 'SMTP (Production)' : 'Not Configured',
    config: {
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com (default)',
        port: process.env.SMTP_PORT || '587 (default)',
        secure: process.env.SMTP_SECURE === 'true' ? 'true (TLS)' : 'false (STARTTLS)',
        user: {
          present: !!process.env.SMTP_USER,
          value: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : 'not set'
        },
        pass: {
          present: !!process.env.SMTP_PASS,
          length: process.env.SMTP_PASS?.length || 0
        }
      },
      emailFrom: emailFrom,
      emailFromName: process.env.EMAIL_FROM_NAME || 'Your Store (default)',
      siteName: process.env.SITE_NAME || 'Your Store (default)',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000 (default)'
    },
    warnings: warnings,
    instructions: instructions,
    note: willUseEthereal 
      ? 'Ethereal is a free testing service. Emails are captured for preview, not actually sent.'
      : hasSmtpConfig
      ? 'Using SMTP for email delivery. Gmail free tier: ~500 recipients/day.'
      : 'Configure SMTP settings for production, or use Ethereal for development testing.'
  });
}
