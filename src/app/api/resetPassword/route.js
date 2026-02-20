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
    if (!email) {
      return createValidationErrorResponse("Email is required");
    }
    const sanitizedEmail = sanitizeString(email.toLowerCase(), 255);
    if (!isValidEmail(sanitizedEmail)) {
      return createValidationErrorResponse("Invalid email format");
    }
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
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, username, display_name')
      .ilike('email', sanitizedEmail)
      .maybeSingle();
    if (userError || !userData) {
      return NextResponse.json({ 
        message: "If an account with that email exists, a password reset email has been sent." 
      }, { status: 200 });
    }
    if (!userData.email) {
      return createErrorResponse("This account does not have an email address. Please contact support.", 400);
    }
    const userName = userData.display_name || userData.username || 'there';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectTo = `${siteUrl}/auth/reset-password`;
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const hasSmtpConfig = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
      const willUseEthereal = isDevelopment && !hasSmtpConfig;
      
      if (isDevelopment) {
        console.log('=== PASSWORD RESET EMAIL DEBUG ===');
        console.log('Environment:', process.env.NODE_ENV);
        console.log('SMTP_USER present:', !!process.env.SMTP_USER);
        console.log('SMTP_PASS present:', !!process.env.SMTP_PASS);
        if (willUseEthereal) {
          console.log('⚠️  Using Ethereal (development mode) - emails are NOT actually sent!');
          console.log('📧 Check console logs for Ethereal preview URL after sending');
        } else if (hasSmtpConfig) {
          console.log('✅ Using SMTP configuration for email delivery');
        } else {
          console.warn('⚠️  No SMTP configuration found - will use Ethereal in development or fail in production');
        }
        console.log('Attempting to send custom email via Nodemailer...');
      }
      const adminClient = createSupabaseAdminClient();
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
      const resetUrl = resetData.properties?.action_link || 
                      resetData.properties?.recovery_link || 
                      (resetData.properties?.hashed_token ? 
                        `${siteUrl}/auth/reset-password?token=${resetData.properties.hashed_token}` : 
                        redirectTo);
      if (isDevelopment) {
        console.log('✅ Reset URL generated:', resetUrl);
        console.log('📧 Sending email to:', sanitizedEmail);
        console.log('👤 User name:', userName);
      }
      const emailResult = await sendPasswordResetEmail({
        email: sanitizedEmail,
        userName,
        resetUrl,
        expiryTime: "1 hour"
      });
      if (isDevelopment) {
        console.log('✅ Email sent successfully via Nodemailer');
        console.log('📧 Email result:', JSON.stringify(emailResult, null, 2));
      }
      if (!emailResult || (!emailResult.id && !emailResult.messageId)) {
        throw new Error('Email send returned no ID - email may not have been sent');
      }
      if (willUseEthereal && emailResult.previewUrl && isDevelopment) {
        console.log('📧 EThereal Preview URL:', emailResult.previewUrl);
        console.log('⚠️  IMPORTANT: Email is NOT actually sent in development mode!');
        console.log('⚠️  Click the preview URL above to view the email');
      }
      return NextResponse.json({ 
        success: true,
        message: willUseEthereal 
          ? "Password reset email prepared. Check server console for Ethereal preview URL (emails are not actually sent in development mode)."
          : "If an account with that email exists, a password reset email has been sent to your email address.",
        previewUrl: willUseEthereal ? emailResult.previewUrl : undefined
      }, { status: 200 });
    } catch (emailError) {
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
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Supabase email sent successfully (fallback)');
      }
      return NextResponse.json({ 
        success: true,
        message: "If an account with that email exists, a password reset email has been sent to your email address." 
      }, { status: 200 });
    }
  } catch (error) {
    return handleError(error, 'resetPassword');
  }
}
