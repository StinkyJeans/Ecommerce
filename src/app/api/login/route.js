import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail, sanitizeString } from "@/lib/validation";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { createErrorResponse, createValidationErrorResponse, handleError } from "@/lib/errors";
import { generateAndSaveSigningKey } from "@/lib/signing";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return createValidationErrorResponse("Email and password are required");
    }

    const sanitizedEmail = sanitizeString(email.toLowerCase(), 255);
    if (!isValidEmail(sanitizedEmail)) {
      return createValidationErrorResponse("Invalid email format");
    }

    const sanitizedPassword = sanitizeString(password, 128);

    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, role, email, seller_status, password_changed_at')
      .eq('email', sanitizedEmail)
      .single();

    const isAdmin = userData && userData.role === 'admin';

    let remainingAttempts = null;
    if (!isAdmin) {
      const rateLimitResult = checkRateLimit(req, 'login');
      if (rateLimitResult && !rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult.resetTime);
      }
      remainingAttempts = rateLimitResult?.remaining ?? null;
    }

    if (userError || !userData) {
      if (!isAdmin) {
        const response = { message: "Invalid Email or Password" };
        if (remainingAttempts !== null && remainingAttempts >= 0) {
          response.remainingAttempts = remainingAttempts;
        }
        return NextResponse.json(response, { status: 401 });
      } else {
        return NextResponse.json({ message: "Invalid Email or Password" }, { status: 401 });
      }
    }

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
        const response = {
          message: "Invalid Email or Password"
        };

        if (userData?.password_changed_at) {
          response.passwordChangedAt = userData.password_changed_at;
        }

        if (!isAdmin) {
          const updatedRateLimit = checkRateLimit(req, 'login');
          if (updatedRateLimit && updatedRateLimit.remaining !== undefined) {
            response.remainingAttempts = updatedRateLimit.remaining;
          }
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

    const signingKey = await generateAndSaveSigningKey(userData.id);

    return NextResponse.json({
      message: "Login successful",
      role: userData.role || "user",
      username: userData.username || null,
      user: authData.user,
      signingKey,
    });

  } catch (error) {
    return handleError(error, 'login');
  }
}
