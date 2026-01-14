import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail, sanitizeString } from "@/lib/validation";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { createErrorResponse, createValidationErrorResponse, handleError } from "@/lib/errors";

export async function POST(req) {
  try {
    // Rate limiting (production only)
    const rateLimitResult = checkRateLimit(req, 'login');
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const { email, password } = await req.json();

    // Input validation
    if (!email || !password) {
      return createValidationErrorResponse("Email and password are required");
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeString(email.toLowerCase(), 255);
    if (!isValidEmail(sanitizedEmail)) {
      return createValidationErrorResponse("Invalid email format");
    }

    // Sanitize password (don't validate strength on login, only on registration)
    const sanitizedPassword = sanitizeString(password, 128);

    const supabase = await createClient();

    // Find user by email only
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, email, seller_status, password_changed_at')
      .eq('email', sanitizedEmail)
      .single();

    if (userError || !userData) {
      // Don't reveal if email exists or not (security best practice)
      return NextResponse.json(
        { message: "Invalid Email or Password" },
        { status: 401 }
      );
    }

    // Ensure we have an email for Supabase Auth
    if (!userData.email) {
      return NextResponse.json(
        { message: "User account does not have an email. Please contact support." },
        { status: 400 }
      );
    }

    if (userData.role === 'seller') {
      if (userData.seller_status === 'pending') {
        return NextResponse.json(
          { 
            message: "Waiting for admin approval",
            sellerStatus: "pending",
            details: "Your seller account is pending approval. Please wait for admin approval before logging in."
          },
          { status: 403 }
        );
      }
      
      if (userData.seller_status === 'rejected') {
        return NextResponse.json(
          { 
            message: "Seller account rejected",
            sellerStatus: "rejected",
            details: "Your seller account has been rejected. Please contact support for more information."
          },
          { status: 403 }
        );
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: sanitizedPassword,
    });

    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { 
            message: "Please confirm your email before logging in"
          },
          { status: 401 }
        );
      }
      
      if (authError.message.includes('Invalid login credentials')) {
        // Check if password was recently changed
        const response = {
          message: "Invalid Email or Password"
        };
        
        // If password was changed recently, include the timestamp
        if (userData?.password_changed_at) {
          response.passwordChangedAt = userData.password_changed_at;
        }
        
        return NextResponse.json(
          response,
          { status: 401 }
        );
      }
      
      return createErrorResponse("Login failed", 401, authError);
    }

    if (!authData.user) {
      return createErrorResponse("Login failed", 401);
    }

    return NextResponse.json({
      message: "Login successful",
      role: userData.role || "user",
      user: authData.user
    });

  } catch (error) {
    return handleError(error, 'login');
  }
}
