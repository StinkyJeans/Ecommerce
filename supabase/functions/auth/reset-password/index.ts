import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../_shared/cors.ts';
import { isValidEmail, sanitizeString } from '../_shared/validation.ts';
import { handleAsyncError } from '../_shared/errors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:3000';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  return handleAsyncError(async () => {
    const { email } = await req.json();

    // Input validation
    if (!email) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['Email is required'], success: false },
        400
      );
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeString(email.toLowerCase(), 255);
    if (!isValidEmail(sanitizedEmail)) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['Invalid email format'], success: false },
        400
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if email exists (case-insensitive)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .ilike('email', sanitizedEmail)
      .maybeSingle();

    // Always return success to prevent email enumeration
    if (userError || !userData) {
      return createCorsResponse({
        success: true,
        message: 'If an account with that email exists, a password reset email has been sent.',
      });
    }

    if (!userData.email) {
      return createCorsResponse(
        { message: 'This account does not have an email address. Please contact support.', success: false },
        400
      );
    }

    const resetUrl = `${SITE_URL}/auth/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
      redirectTo: resetUrl,
    });

    if (resetError) {
      return createCorsResponse(
        { message: 'Failed to send reset email. Please try again later.', success: false },
        500
      );
    }

    return createCorsResponse({
      success: true,
      message: 'If an account with that email exists, a password reset email has been sent to your email address.',
    });
  });
});
