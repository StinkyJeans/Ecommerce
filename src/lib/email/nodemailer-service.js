import nodemailer from 'nodemailer';
import { getPasswordResetTemplate, getSellerWelcomeTemplate, getSellerApprovalTemplate } from './templates';
import { getOAuth2Auth } from './gmail-oauth2';

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Your Store';
const SITE_NAME = process.env.SITE_NAME || 'Your Store';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
let transporter = null;
let transporterPromise = null;

async function getTransporter() {
  if (transporter) {
    return transporter;
  }
  if (transporterPromise) {
    return transporterPromise;
  }
  transporterPromise = (async () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Check for Gmail OAuth2 configuration (preferred method)
    const hasOAuth2Config = process.env.GMAIL_CLIENT_ID && 
                            process.env.GMAIL_CLIENT_SECRET && 
                            process.env.GMAIL_REFRESH_TOKEN;
    
    // Check for SMTP configuration (fallback)
    const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;
    
    // Use Ethereal in development if no email config is provided
    if (isDevelopment && !hasOAuth2Config && !hasSmtpConfig) {
      console.log('📧 Nodemailer: Using Ethereal test account (development mode)');
      try {
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
        console.log('✅ Ethereal test account created');
        console.log('📧 Preview emails at: https://ethereal.email');
        console.log(`📧 Test account: ${testAccount.user}`);
        return transporter;
      } catch (error) {
        console.error('❌ Failed to create Ethereal test account:', error);
        throw new Error('Failed to create Ethereal test account: ' + error.message);
      }
    }

    // Use OAuth2 if configured (preferred for Gmail)
    if (hasOAuth2Config) {
      try {
        console.log('📧 Nodemailer: Using Gmail OAuth2 authentication');
        const oauth2Auth = await getOAuth2Auth();
        const emailFrom = process.env.EMAIL_FROM || process.env.GMAIL_USER;
        
        if (!emailFrom) {
          throw new Error('EMAIL_FROM or GMAIL_USER must be set when using OAuth2');
        }

        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: oauth2Auth
        });

        try {
          await transporter.verify();
          console.log('✅ Gmail OAuth2 connection verified successfully');
        } catch (error) {
          console.error('❌ Gmail OAuth2 connection verification failed:', error);
          throw new Error('Gmail OAuth2 connection failed: ' + error.message);
        }
        
        return transporter;
      } catch (error) {
        console.error('❌ Failed to initialize Gmail OAuth2:', error);
        // Fall through to SMTP if OAuth2 fails
        if (!hasSmtpConfig) {
          throw error;
        }
        console.log('⚠️  Falling back to SMTP configuration');
      }
    }

    // Fallback to SMTP configuration
    if (hasSmtpConfig) {
      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      // Port 587 uses STARTTLS (secure: false), Port 465 uses SSL/TLS (secure: true)
      const smtpSecure = smtpPort === 465 || process.env.SMTP_SECURE === 'true';
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      console.log('📧 Nodemailer: Using SMTP configuration');
      console.log(`📧 SMTP Host: ${smtpHost}:${smtpPort}`);
      console.log(`📧 SMTP User: ${smtpUser}`);
      console.log(`📧 SMTP Secure: ${smtpSecure} (Port ${smtpPort} uses ${smtpSecure ? 'SSL/TLS' : 'STARTTLS'})`);
      
      let transporterConfig;

      // Gmail-specific configuration
      if (smtpHost.includes('gmail.com')) {
        // Use Gmail service (simpler and more reliable)
        transporterConfig = {
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        };
        console.log('📧 Using Gmail service configuration (Note: App passwords deprecated after March 2025)');
      } else {
        // Generic SMTP configuration
        transporterConfig = {
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass
          },
          tls: {
            rejectUnauthorized: false // Allow self-signed certificates
          }
        };
        console.log('📧 Using generic SMTP configuration');
      }

      transporter = nodemailer.createTransport(transporterConfig);
      try {
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully');
      } catch (error) {
        console.error('❌ SMTP connection verification failed:', error);
        console.error('Error details:', {
          code: error.code,
          command: error.command,
          response: error.response,
          responseCode: error.responseCode
        });
        throw new Error('SMTP connection failed: ' + error.message);
      }
      return transporter;
    }

    // No configuration found
    throw new Error(
      'Email configuration missing. Set Gmail OAuth2 credentials (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN) ' +
      'or SMTP credentials (SMTP_USER, SMTP_PASS) in .env.local (or use Ethereal in development)'
    );
  })();
  return transporterPromise;
}
async function sendEmail({ to, subject, html, text }) {
  const mailTransporter = await getTransporter();
  const mailOptions = {
    from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
    to: to,
    subject: subject,
    html: html,
    text: text
  };
  try {
    const info = await mailTransporter.sendMail(mailOptions);
    let previewUrl = null;
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('📧 Ethereal Preview URL:', previewUrl);
      }
    }
    return {
      id: info.messageId,
      messageId: info.messageId,
      response: info.response,
      previewUrl: previewUrl
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email: ' + error.message);
  }
}
export async function sendPasswordResetEmail({ email, userName, resetUrl, expiryTime = "1 hour" }) {
  const html = getPasswordResetTemplate({
    userName,
    resetUrl,
    expiryTime,
    siteName: SITE_NAME
  });
  const textContent = `Hello ${userName || 'there'},\n\nWe received a request to reset your password for your ${SITE_NAME} account. Please click the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in ${expiryTime}. If you didn't request this, please ignore this email.\n\nBest regards,\n${SITE_NAME}`;
  try {
    console.log('📧 Nodemailer: Preparing to send password reset email to:', email);
    const result = await sendEmail({
      to: email,
      subject: `Reset Your Password - ${SITE_NAME}`,
      html: html,
      text: textContent
    });
    console.log('✅ Password reset email sent successfully! Message ID:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
}
export async function sendSellerWelcomeEmail({ email, userName }) {
  const loginUrl = `${SITE_URL}`;
  const html = getSellerWelcomeTemplate({
    userName,
    loginUrl,
    siteName: SITE_NAME
  });
  const textContent = `Hello ${userName || 'there'},\n\nThank you for registering as a seller on ${SITE_NAME}! Your account has been created and is currently pending admin approval.\n\nYou'll receive an email notification once your account is approved. In the meantime, you can log in to check your approval status.\n\nLogin: ${loginUrl}\n\nBest regards,\n${SITE_NAME}`;
  try {
    console.log('📧 Nodemailer: Preparing to send seller welcome email to:', email);
    const result = await sendEmail({
      to: email,
      subject: `Welcome to ${SITE_NAME} - Seller Account Created`,
      html: html,
      text: textContent
    });
    console.log('✅ Seller welcome email sent successfully! Message ID:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error sending seller welcome email:', error);
    throw error;
  }
}
export async function sendSellerApprovalEmail({ email, userName, approved = true }) {
  const loginUrl = `${SITE_URL}`;
  const html = getSellerApprovalTemplate({
    userName,
    loginUrl,
    siteName: SITE_NAME,
    approved
  });
  const subject = approved 
    ? `Your Seller Account Has Been Approved - ${SITE_NAME}`
    : `Seller Account Application Update - ${SITE_NAME}`;
  const textContent = approved
    ? `Hello ${userName || 'there'},\n\nCongratulations! Your seller account has been approved. You can now start adding products and selling on our platform.\n\nLogin: ${loginUrl}\n\nBest regards,\n${SITE_NAME}`
    : `Hello ${userName || 'there'},\n\nWe're sorry, but your seller account application has been rejected. If you have any questions, please contact our support team.\n\nBest regards,\n${SITE_NAME}`;
  try {
    console.log('📧 Nodemailer: Preparing to send seller approval email to:', email);
    const result = await sendEmail({
      to: email,
      subject: subject,
      html: html,
      text: textContent
    });
    console.log('✅ Seller approval email sent successfully! Message ID:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error sending seller approval email:', error);
    throw error;
  }
}
