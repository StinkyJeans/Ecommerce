import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail, sanitizeString } from "@/lib/validation";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { createErrorResponse, createValidationErrorResponse, handleError } from "@/lib/errors";

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

    // Check if email exists (case-insensitive)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
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

    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      sanitizedEmail,
      {
        redirectTo: resetUrl,
      }
    );

    if (resetError) {
      return createErrorResponse("Failed to send reset email. Please try again later.", 500, resetError);
    }

    return NextResponse.json({ 
      success: true,
      message: "If an account with that email exists, a password reset email has been sent to your email address." 
    }, { status: 200 });

  } catch (error) {
    return handleError(error, 'resetPassword');
  }
}
