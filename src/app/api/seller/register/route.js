import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { isValidEmail, validatePasswordStrength, sanitizeString, validateLength, isValidImageUrl, isValidPhone } from "@/lib/validation";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { createErrorResponse, createValidationErrorResponse, handleError } from "@/lib/errors";
import { sendSellerWelcomeEmail } from "@/lib/email/service";

export async function POST(req) {
  try {
    // Rate limiting (production only)
    const rateLimitResult = checkRateLimit(req, 'register');
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const { displayName, password, email, contact, idUrl } = await req.json();

    // Input validation
    const missingFields = [];
    if (!displayName) missingFields.push("Display name");
    if (!password) missingFields.push("Password");
    if (!email) missingFields.push("Email");
    if (!contact) missingFields.push("Contact/Phone");
    if (!idUrl) missingFields.push("ID document");
    
    if (missingFields.length > 0) {
      return createValidationErrorResponse(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Sanitize inputs
    const sanitizedDisplayName = sanitizeString(displayName, 50);
    const sanitizedEmail = sanitizeString(email.toLowerCase(), 255);
    const sanitizedContact = sanitizeString(contact, 20);

    // Validate inputs
    const validationErrors = [];
    
    if (!validateLength(sanitizedDisplayName, 2, 50)) {
      validationErrors.push("Display name must be between 2 and 50 characters");
    }
    if (!isValidEmail(sanitizedEmail)) {
      validationErrors.push("Invalid email format");
    }
    if (!isValidPhone(sanitizedContact)) {
      validationErrors.push("Invalid phone number format");
    }
    if (!isValidImageUrl(idUrl)) {
      validationErrors.push(`Invalid image URL format. Received: ${idUrl ? idUrl.substring(0, 100) : 'empty'}`);
    }
    
    if (validationErrors.length > 0) {
      return createValidationErrorResponse(validationErrors);
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
          username: sanitizedDisplayName, // Also store as username for compatibility
          role: "seller"
        }
      }
    });

    if (authError) {
      return createErrorResponse("Registration failed", 400, authError);
    }

    // Try to auto-confirm email if service role key is available
    if (authData.user && !authData.user.email_confirmed_at) {
      try {
        const adminClient = createSupabaseAdminClient();
        const { error: confirmError } = await adminClient.auth.admin.updateUserById(
          authData.user.id,
          { email_confirm: true }
        );
        
        if (confirmError) {
          // Error auto-confirming seller - log but continue (not critical)
          console.warn('Could not auto-confirm email:', confirmError.message);
        }
      } catch (adminError) {
        // Service role key missing or other admin client error - not critical
        // Seller will need to confirm email manually
        console.warn('Admin client unavailable, email confirmation skipped:', adminError.message);
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

    // Send welcome email (non-blocking - don't fail registration if email fails)
    try {
      console.log('=== SELLER WELCOME EMAIL DEBUG ===');
      console.log('Attempting to send welcome email to:', sanitizedEmail);
      console.log('RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
      
      const emailResult = await sendSellerWelcomeEmail({
        email: sanitizedEmail,
        userName: sanitizedDisplayName
      });
      
      console.log('Welcome email sent successfully!');
      console.log('Email result:', JSON.stringify(emailResult, null, 2));
      
      if (!emailResult || !emailResult.id) {
        console.error('Email send returned no ID - email may not have been sent');
      }
    } catch (emailError) {
      // Log detailed error but don't fail registration
      console.error('=== FAILED TO SEND WELCOME EMAIL ===');
      console.error('Error message:', emailError.message);
      console.error('Error stack:', emailError.stack);
      console.error('Full error:', JSON.stringify(emailError, null, 2));
      console.warn('Registration succeeded but welcome email failed');
    }

    return NextResponse.json({ 
      message: "Seller registration successful!",
      details: "Your account is pending admin approval. You will be able to login and start selling once approved (usually within 24-48 hours)."
    }, { status: 201 });
  } catch (err) {
    return handleError(err, 'sellerRegister');
  }
}
