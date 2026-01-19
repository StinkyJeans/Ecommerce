import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { isValidEmail, sanitizeString } from "@/lib/validation";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { createErrorResponse, createValidationErrorResponse, handleError } from "@/lib/errors";
import { sendPasswordResetEmail } from "@/lib/email/service";

export async function POST(req) {
  try {
    const { email } = await req.json();

    // Input validation
    if (!email) {
      return createValidationErrorResponse("Email is required");
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeString(email.toLowerCase(), 255);
    if (!isValidEmail(sanitizedEmail)) {
      return createValidationErrorResponse("Invalid email format");
    }

    // Rate limiting (production only) - per email to prevent abuse
    const rateLimitResult = checkRateLimit(req, 'resetPassword', sanitizedEmail);
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ 
        message: "Supabase client not initialized" 
      }, { status: 500 });
    }

    // Check if email exists (case-insensitive) and get user info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, username, display_name')
      .ilike('email', sanitizedEmail)
      .maybeSingle();

    // Always return success to prevent email enumeration
    if (userError || !userData) {
      return NextResponse.json({ 
        message: "If an account with that email exists, a password reset email has been sent." 
      }, { status: 200 });
    }

    if (!userData.email) {
      return createErrorResponse("This account does not have an email address. Please contact support.", 400);
    }

    // Get user's display name for email personalization
    const userName = userData.display_name || userData.username || 'there';

    // Generate password reset token using Supabase Admin API
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectTo = `${siteUrl}/auth/reset-password`;
    
    try {
      // Use Nodemailer service to send custom email
      console.log('=== PASSWORD RESET EMAIL DEBUG ===');
      console.log('Environment:', process.env.NODE_ENV);
      console.log('SMTP_USER present:', !!process.env.SMTP_USER);
      console.log('SMTP_PASS present:', !!process.env.SMTP_PASS);
      
      const isDevelopment = process.env.NODE_ENV === 'development';
      const hasSmtpConfig = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
      const willUseEthereal = isDevelopment && !hasSmtpConfig;
      
      if (willUseEthereal) {
        console.log('⚠️  Using Ethereal (development mode) - emails are NOT actually sent!');
        console.log('📧 Check console logs for Ethereal preview URL after sending');
      } else if (hasSmtpConfig) {
        console.log('✅ Using SMTP configuration for email delivery');
      } else {
        console.warn('⚠️  No SMTP configuration found - will use Ethereal in development or fail in production');
      }
      
      console.log('Attempting to send custom email via Nodemailer...');
      
      const adminClient = createSupabaseAdminClient();
      
      // Generate password reset link using Admin API
      const { data: resetData, error: resetTokenError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: sanitizedEmail,
        options: {
          redirectTo
        }
      });

      if (resetTokenError || !resetData) {
        console.error('❌ Failed to generate reset link:', resetTokenError);
        throw resetTokenError || new Error('Failed to generate reset token');
      }

      // Extract the reset URL from the generated link
      // The link format is usually: https://[project].supabase.co/auth/v1/verify?token=...&type=recovery&redirect_to=...
      const resetUrl = resetData.properties?.action_link || 
                      resetData.properties?.recovery_link || 
                      (resetData.properties?.hashed_token ? 
                        `${siteUrl}/auth/reset-password?token=${resetData.properties.hashed_token}` : 
                        redirectTo);

      console.log('✅ Reset URL generated:', resetUrl);
      console.log('📧 Sending email to:', sanitizedEmail);
      console.log('👤 User name:', userName);

      // Send custom email using Nodemailer
      const emailResult = await sendPasswordResetEmail({
        email: sanitizedEmail,
        userName,
        resetUrl,
        expiryTime: "1 hour"
      });

      console.log('✅ Email sent successfully via Nodemailer');
      console.log('📧 Email result:', JSON.stringify(emailResult, null, 2));
      
      // Verify email was actually sent
      if (!emailResult || (!emailResult.id && !emailResult.messageId)) {
        throw new Error('Email send returned no ID - email may not have been sent');
      }

      // In development with Ethereal, log the preview URL
      if (willUseEthereal && emailResult.previewUrl) {
        console.log('📧 EThereal Preview URL:', emailResult.previewUrl);
        console.log('⚠️  IMPORTANT: Email is NOT actually sent in development mode!');
        console.log('⚠️  Click the preview URL above to view the email');
      }

      // Success - custom email sent
      return NextResponse.json({ 
        success: true,
        message: willUseEthereal 
          ? "Password reset email prepared. Check server console for Ethereal preview URL (emails are not actually sent in development mode)."
          : "If an account with that email exists, a password reset email has been sent to your email address.",
        previewUrl: willUseEthereal ? emailResult.previewUrl : undefined
      }, { status: 200 });
    } catch (emailError) {
      // If custom email fails, fall back to Supabase's built-in email
      console.error('=== CUSTOM EMAIL SERVICE ERROR ===');
      console.error('Error message:', emailError.message);
      console.error('Error stack:', emailError.stack);
      console.error('Full error:', JSON.stringify(emailError, Object.getOwnPropertyNames(emailError), 2));
      console.warn('⚠️  Falling back to Supabase email service');
      
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        sanitizedEmail,
        {
          redirectTo: redirectTo,
        }
      );

      if (resetError) {
        console.error('❌ Supabase email also failed:', resetError);
        return createErrorResponse("Failed to send reset email. Please try again later.", 500, resetError);
      }

      console.log('✅ Supabase email sent successfully (fallback)');
      return NextResponse.json({ 
        success: true,
        message: "If an account with that email exists, a password reset email has been sent to your email address." 
      }, { status: 200 });
    }

  } catch (error) {
    return handleError(error, 'resetPassword');
  }
}
