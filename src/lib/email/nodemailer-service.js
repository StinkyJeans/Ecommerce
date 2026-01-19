/**
 * Nodemailer Email Service
 * Handles sending emails using Nodemailer with:
 * - Development: Ethereal (test account, emails captured for testing)
 * - Production: Gmail SMTP (or other SMTP server)
 */

import nodemailer from 'nodemailer';
import { getPasswordResetTemplate, getSellerWelcomeTemplate, getSellerApprovalTemplate } from './templates';

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Your Store';
const SITE_NAME = process.env.SITE_NAME || 'Your Store';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Cache transporter to avoid recreating it on every call
let transporter = null;
let transporterPromise = null;

/**
 * Get or create Nodemailer transporter
 * - Development: Uses Ethereal test account (if SMTP_USER not set)
 * - Production: Uses SMTP configuration from environment variables
 * @returns {Promise<nodemailer.Transporter>} Nodemailer transporter
 */
async function getTransporter() {
  // Return cached transporter if available
  if (transporter) {
    return transporter;
  }

  // If transporter is being created, wait for it
  if (transporterPromise) {
    return transporterPromise;
  }

  // Create transporter
  transporterPromise = (async () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS;

    // Development mode: Use Ethereal if SMTP not configured
    if (isDevelopment && !hasSmtpConfig) {
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

    // Production mode or development with SMTP config: Use SMTP
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP configuration missing. Set SMTP_USER and SMTP_PASS in .env.local (or use Ethereal in development)');
    }

    console.log('📧 Nodemailer: Using SMTP configuration');
    console.log(`📧 SMTP Host: ${smtpHost}:${smtpPort}`);
    console.log(`📧 SMTP User: ${smtpUser}`);

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    // Verify connection
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (error) {
      console.error('❌ SMTP connection verification failed:', error);
      throw new Error('SMTP connection failed: ' + error.message);
    }

    return transporter;
  })();

  return transporterPromise;
}

/**
 * Send email via Nodemailer
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML email content
 * @param {string} params.text - Plain text email content
 * @returns {Promise<Object>} Email result with messageId
 */
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
    
    // In development with Ethereal, get preview URL
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

/**
 * Send password reset email
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.userName - User's display name or username
 * @param {string} params.resetUrl - Password reset URL
 * @param {string} params.expiryTime - Expiry time (default: "1 hour")
 * @returns {Promise<Object>} Email result
 */
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

/**
 * Send seller welcome email
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.userName - Seller's display name
 * @returns {Promise<Object>} Email result
 */
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

/**
 * Send seller approval/rejection email
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.userName - Seller's display name
 * @param {boolean} params.approved - Whether seller was approved
 * @returns {Promise<Object>} Email result
 */
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
