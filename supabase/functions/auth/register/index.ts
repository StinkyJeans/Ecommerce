import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../../_shared/cors.ts';
import {
  isValidEmail,
  validatePasswordStrength,
  sanitizeString,
  validateLength,
  isValidImageUrl,
} from '../../_shared/validation.ts';
import { createErrorResponse, handleAsyncError } from '../../_shared/errors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:3000';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  return handleAsyncError(async () => {
    const { displayName, password, role, email, contact, idUrl } = await req.json();

    // Input validation
    if (!displayName || !password || !email) {
      return createCorsResponse(
        { message: 'Display name, email, and password are required', success: false },
        400
      );
    }

    // Sanitize and validate inputs
    const sanitizedDisplayName = sanitizeString(displayName, 50);
    const sanitizedEmail = sanitizeString(email.toLowerCase(), 255);
    const sanitizedContact = contact ? sanitizeString(contact, 20) : null;

    // Validate display name length
    if (!validateLength(sanitizedDisplayName, 2, 50)) {
      return createCorsResponse(
        { message: 'Display name must be between 2 and 50 characters', success: false },
        400
      );
    }

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return createCorsResponse(
        { message: 'Invalid email format', success: false },
        400
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return createCorsResponse(
        {
          message: 'Password validation failed',
          errors: passwordValidation.errors,
          success: false,
        },
        400
      );
    }

    // Validate image URL if provided
    if (idUrl && !isValidImageUrl(idUrl)) {
      return createCorsResponse(
        { message: 'Invalid image URL format', success: false },
        400
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if email already exists
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('users')
      .select('email')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    if (emailCheckError && emailCheckError.code !== 'PGRST116') {
      return createCorsResponse(
        { message: 'Error checking email availability', success: false },
        500
      );
    }

    if (existingEmail) {
      return createCorsResponse(
        { message: 'Email already exists', success: false },
        400
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password: password,
      options: {
        data: {
          display_name: sanitizedDisplayName,
          role: role || 'user',
        },
        emailRedirectTo: `${SITE_URL}/auth/callback`,
      },
    });

    if (authError) {
      if (
        authError.message.includes('already registered') ||
        authError.message.includes('already exists')
      ) {
        return createCorsResponse(
          { message: 'Email is already registered', success: false },
          400
        );
      }
      return createCorsResponse(
        { message: 'Registration failed', success: false },
        400
      );
    }

    if (!authData.user) {
      return createCorsResponse(
        { message: 'Failed to create authentication account', success: false },
        500
      );
    }

    // Auto-confirm email (for development)
    if (authData.user && !authData.user.email_confirmed_at) {
      const { error: confirmError } = await supabase.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      );

      if (confirmError) {
        // Log but don't fail registration
        console.error('Failed to auto-confirm email:', confirmError);
      }
    }

    // Create user record
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        username: sanitizedDisplayName,
        email: sanitizedEmail,
        contact: sanitizedContact,
        id_url: idUrl || null,
        role: role || 'user',
      })
      .select()
      .single();

    if (userError) {
      if (userError.code === '23505') {
        if (userError.message.includes('username')) {
          return createCorsResponse(
            { message: 'Display name already exists', success: false },
            400
          );
        }
        if (userError.message.includes('email')) {
          return createCorsResponse(
            { message: 'Email already exists', success: false },
            400
          );
        }
      }

      return createCorsResponse(
        { message: 'Failed to create user', success: false },
        500
      );
    }

    return createCorsResponse(
      {
        success: true,
        message: `${role === 'seller' ? 'Seller' : 'User'} registered successfully`,
      },
      201
    );
  });
});
