import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors, createCorsResponse } from '../_shared/cors.ts';
import { isValidEmail, validatePasswordStrength, sanitizeString, validateLength, isValidImageUrl, isValidPhone } from '../_shared/validation.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  try {
    const { displayName, password, email, contact, idUrl } = await req.json();
    if (!displayName || !password || !email || !contact || !idUrl) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['All fields are required'], success: false },
        400
      );
    }
    const sanitizedDisplayName = sanitizeString(displayName, 50);
    const sanitizedEmail = sanitizeString(email.toLowerCase(), 255);
    const sanitizedContact = sanitizeString(contact, 20);
    if (!validateLength(sanitizedDisplayName, 2, 50)) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['Display name must be between 2 and 50 characters'], success: false },
        400
      );
    }
    if (!isValidEmail(sanitizedEmail)) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['Invalid email format'], success: false },
        400
      );
    }
    if (!isValidPhone(sanitizedContact)) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['Invalid phone number format'], success: false },
        400
      );
    }
    if (!isValidImageUrl(idUrl)) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['Invalid image URL format'], success: false },
        400
      );
    }
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return createCorsResponse(
        { message: 'Validation failed', errors: passwordValidation.errors, success: false },
        400
      );
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: existingEmail } = await supabase
      .from('users')
      .select('email')
      .eq('email', sanitizedEmail)
      .maybeSingle();
    if (existingEmail) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['Email already registered'], success: false },
        400
      );
    }
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password: password,
      options: {
        data: {
          display_name: sanitizedDisplayName,
          role: 'seller',
        },
      },
    });
    if (authError) {
      return createCorsResponse(
        { message: 'Registration failed', success: false },
        400
      );
    }
    if (authData.user && !authData.user.email_confirmed_at) {
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      );
    }
    const { error: userError } = await supabase
      .from('users')
      .insert({
        username: sanitizedDisplayName,
        email: sanitizedEmail,
        contact: sanitizedContact,
        id_url: idUrl,
        role: 'seller',
        seller_status: 'pending',
      });
    if (userError) {
      return createCorsResponse(
        { message: 'Failed to create seller', success: false },
        500
      );
    }
    return createCorsResponse(
      {
        message: 'Seller registration successful!',
        details: 'Your account is pending admin approval. You will be able to login and start selling once approved (usually within 24-48 hours).',
      },
      201
    );
  } catch (error) {
    return createCorsResponse(
      { message: 'Server error', success: false },
      500
    );
  }
});