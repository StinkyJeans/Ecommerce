import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { isValidEmail, validatePasswordStrength, sanitizeString, validateLength, isValidImageUrl } from "@/lib/validation";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { createErrorResponse, createValidationErrorResponse, handleError } from "@/lib/errors";

export async function POST(req) {
  try {
    // Rate limiting (production only)
    const rateLimitResult = checkRateLimit(req, 'register');
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const { displayName, password, role, email, contact, idUrl } = await req.json();

    // Input validation
    if (!displayName || !password || !email) {
      return createValidationErrorResponse("Display name, email, and password are required");
    }

    // Sanitize and validate inputs
    const sanitizedDisplayName = sanitizeString(displayName, 50);
    const sanitizedEmail = sanitizeString(email.toLowerCase(), 255);
    const sanitizedContact = contact ? sanitizeString(contact, 20) : null;

    // Validate display name length
    if (!validateLength(sanitizedDisplayName, 2, 50)) {
      return createValidationErrorResponse("Display name must be between 2 and 50 characters");
    }

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return createValidationErrorResponse("Invalid email format");
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return createValidationErrorResponse(passwordValidation.errors);
    }

    // Validate image URL if provided
    if (idUrl && !isValidImageUrl(idUrl)) {
      return createValidationErrorResponse("Invalid image URL format");
    }

    const supabase = await createClient();

    // Check if email already exists
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('users')
      .select('email')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    if (emailCheckError && emailCheckError.code !== 'PGRST116') {
      if (emailCheckError.message && emailCheckError.message.includes('schema cache')) {
        return createErrorResponse(
          "Database table not found. Please run the schema setup first.",
          500,
          emailCheckError
        );
      }
      
      return createErrorResponse("Error checking email availability", 500, emailCheckError);
    }

    if (existingEmail) {
      return createValidationErrorResponse("Email already exists");
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password: password,
      options: {
        data: {
          display_name: sanitizedDisplayName,
          username: sanitizedDisplayName, // Also store as username for compatibility
          role: role || "user"
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return createValidationErrorResponse("Email is already registered");
      }
      return createErrorResponse("Registration failed", 400, authError);
    }

    if (!authData.user) {
      return createErrorResponse("Failed to create authentication account", 500);
    }

    if (authData.user && !authData.user.email_confirmed_at) {
      const adminClient = createSupabaseAdminClient();
      const { error: confirmError } = await adminClient.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        // Error auto-confirming user - log but don't fail registration
      }
    }

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        username: sanitizedDisplayName,
        email: sanitizedEmail,
        contact: sanitizedContact,
        id_url: idUrl || null,
        role: role || "user"
      })
      .select()
      .single();

    if (userError) {
      if (userError.message && userError.message.includes('schema cache')) {
        return createErrorResponse(
          "Database table not found. Please run the schema setup first.",
          500,
          userError
        );
      }
      
      if (userError.code === '23505') {
        if (userError.message.includes('username')) {
          return createValidationErrorResponse("Display name already exists");
        }
        if (userError.message.includes('email')) {
          return createValidationErrorResponse("Email already exists");
        }
      }
      
      return createErrorResponse("Failed to create user", 500, userError);
    }

    return NextResponse.json(
      { message: `${role === "seller" ? "Seller" : "User"} registered successfully` },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error, 'register');
  }
}
