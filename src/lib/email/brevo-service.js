/**
 * Brevo Email Service
 * Handles sending emails using Brevo (formerly Sendinblue) REST API
 * Based on: https://developers.brevo.com/reference/sendtransacemail
 */

import { getPasswordResetTemplate, getSellerWelcomeTemplate, getSellerApprovalTemplate } from './templates';

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Your Store';
const SITE_NAME = process.env.SITE_NAME || 'Your Store';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Send email via Brevo REST API
 * @param {Object} params - Email parameters
 * @param {string} params.senderEmail - Sender email address
 * @param {string} params.senderName - Sender name
 * @param {string} params.toEmail - Recipient email address
 * @param {string} params.toName - Recipient name
 * @param {string} params.subject - Email subject
 * @param {string} params.htmlContent - HTML email content
 * @param {string} params.textContent - Plain text email content
 * @returns {Promise<Object>} Brevo API response with messageId
 */
async function sendEmailViaBrevo({ senderEmail, senderName, toEmail, toName, subject, htmlContent, textContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured. Please add it to your .env.local file.');
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: toEmail,
          name: toName || toEmail
        }
      ],
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Brevo API error (${response.status}): ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Send password reset email
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.userName - User's display name or username
 * @param {string} params.resetUrl - Password reset URL
 * @param {string} params.expiryTime - Expiry time (default: "1 hour")
 * @returns {Promise<Object>} Brevo API response
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
    console.log('Brevo: Preparing to send password reset email to:', email);
    console.log('Brevo: From address:', `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`);
    console.log('Brevo: API Key present:', !!process.env.BREVO_API_KEY);
    
    const result = await sendEmailViaBrevo({
      senderEmail: EMAIL_FROM,
      senderName: EMAIL_FROM_NAME,
      toEmail: email,
      toName: userName || 'User',
      subject: `Reset Your Password - ${SITE_NAME}`,
      htmlContent: html,
      textContent: textContent
    });

    console.log('Brevo: Email sent successfully!');
    console.log('Brevo: Message ID:', result.messageId);
    console.log('✅ IMPORTANT: Check Brevo Dashboard → Transactional Emails to verify email was sent');
    console.log('✅ Dashboard URL: https://app.brevo.com/transactional-emails');
    
    return { id: result.messageId, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
}

/**
 * Send seller welcome email
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.userName - Seller's display name
 * @returns {Promise<Object>} Brevo API response
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
    console.log('Brevo: Preparing to send seller welcome email to:', email);
    
    const result = await sendEmailViaBrevo({
      senderEmail: EMAIL_FROM,
      senderName: EMAIL_FROM_NAME,
      toEmail: email,
      toName: userName || 'Seller',
      subject: `Welcome to ${SITE_NAME} - Seller Account Created`,
      htmlContent: html,
      textContent: textContent
    });

    console.log('Brevo: Seller welcome email sent successfully, Message ID:', result.messageId);
    return { id: result.messageId, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending seller welcome email:', error);
    throw error;
  }
}

/**
 * Send seller approval/rejection email
 * @param {Object} params - Email parameters
 * @param {string} params.email - Recipient email address
 * @param {string} params.userName - Seller's display name
 * @param {boolean} params.approved - Whether seller was approved
 * @returns {Promise<Object>} Brevo API response
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
    console.log('Brevo: Preparing to send seller approval email to:', email);
    
    const result = await sendEmailViaBrevo({
      senderEmail: EMAIL_FROM,
      senderName: EMAIL_FROM_NAME,
      toEmail: email,
      toName: userName || 'Seller',
      subject: subject,
      htmlContent: html,
      textContent: textContent
    });

    console.log('Brevo: Seller approval email sent successfully, Message ID:', result.messageId);
    return { id: result.messageId, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending seller approval email:', error);
    throw error;
  }
}
