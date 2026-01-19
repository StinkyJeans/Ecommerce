/**
 * Email Service
 * Handles sending emails using Nodemailer
 * - Development: Ethereal (test account, emails captured for testing)
 * - Production: Gmail SMTP (or other SMTP server)
 */

export { 
  sendPasswordResetEmail, 
  sendSellerWelcomeEmail, 
  sendSellerApprovalEmail 
} from './nodemailer-service';
