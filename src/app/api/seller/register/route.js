import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { isValidEmail, validatePasswordStrength, sanitizeString, validateLength, isValidImageUrl, isValidPhone } from "@/lib/validation";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { createErrorResponse, createValidationErrorResponse, handleError } from "@/lib/errors";

export async function POST(req) {
  try {
    // Rate limiting (production only)
    const rateLimitResult = checkRateLimit(req, 'register');
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const { displayName, password, email, contact, idUrl } = await req.json();

    // Input validation
    if (!displayName || !password || !email || !contact || !idUrl) {
      return createValidationErrorResponse("All fields are required");
    }

    // Sanitize inputs
    const sanitizedDisplayName = sanitizeString(displayName, 50);
    const sanitizedEmail = sanitizeString(email.toLowerCase(), 255);
    const sanitizedContact = sanitizeString(contact, 20);

    // Validate inputs
    if (!validateLength(sanitizedDisplayName, 2, 50)) {
      return createValidationErrorResponse("Display name must be between 2 and 50 characters");
    }
    if (!isValidEmail(sanitizedEmail)) {
      return createValidationErrorResponse("Invalid email format");
    }
    if (!isValidPhone(sanitizedContact)) {
      return createValidationErrorResponse("Invalid phone number format");
    }
    if (!isValidImageUrl(idUrl)) {
      return createValidationErrorResponse("Invalid image URL format");
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return createValidationErrorResponse(passwordValidation.errors);
    }

    const supabase = await createClient();

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('email')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    if (existingEmail) {
      return createValidationErrorResponse("Email already registered");
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password: password,
      options: {
        data: {
          display_name: sanitizedDisplayName,
          role: "seller"
        }
      }
    });

    if (authError) {
      return createErrorResponse("Registration failed", 400, authError);
    }

    if (authData.user && !authData.user.email_confirmed_at) {
      const adminClient = createSupabaseAdminClient();
      const { error: confirmError } = await adminClient.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        // Error auto-confirming seller - log but continue
      }
    }

    const { error: userError } = await supabase
      .from('users')
      .insert({
        username: sanitizedDisplayName,
        email: sanitizedEmail,
        contact: sanitizedContact,
        id_url: idUrl,
        role: "seller",
        seller_status: "pending"
      });

    if (userError) {
      return handleError(userError, 'sellerRegister');
    }

    return NextResponse.json({ 
      message: "Seller registration successful!",
      details: "Your account is pending admin approval. You will be able to login and start selling once approved (usually within 24-48 hours)."
    }, { status: 201 });
  } catch (err) {
    return handleError(err, 'sellerRegister');
  }
}
