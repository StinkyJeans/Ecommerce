import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../../_shared/cors.ts';
import { isValidEmail, sanitizeString } from '../../_shared/validation.ts';
import { createErrorResponse, handleAsyncError } from '../../_shared/errors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  return handleAsyncError(async () => {
    const { email, password } = await req.json();

    // Input validation
    if (!email || !password) {
      return createCorsResponse(
        { message: 'Email and password are required', success: false },
        400
      );
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeString(email.toLowerCase(), 255);
    if (!isValidEmail(sanitizedEmail)) {
      return createCorsResponse(
        { message: 'Invalid email format', success: false },
        400
      );
    }

    // Sanitize password
    const sanitizedPassword = sanitizeString(password, 128);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, email, seller_status, password_changed_at')
      .eq('email', sanitizedEmail)
      .single();

    if (userError || !userData) {
      // Don't reveal if email exists (security best practice)
      return createCorsResponse(
        { message: 'Invalid Email or Password', success: false },
        401
      );
    }

    // Ensure we have an email for Supabase Auth
    if (!userData.email) {
      return createCorsResponse(
        { message: 'User account does not have an email. Please contact support.', success: false },
        400
      );
    }

    // Check seller status
    if (userData.role === 'seller') {
      if (userData.seller_status === 'pending') {
        return createCorsResponse(
          {
            message: 'Waiting for admin approval',
            sellerStatus: 'pending',
            details: 'Your seller account is pending approval. Please wait for admin approval before logging in.',
            success: false,
          },
          403
        );
      }

      if (userData.seller_status === 'rejected') {
        return createCorsResponse(
          {
            message: 'Seller account rejected',
            sellerStatus: 'rejected',
            details: 'Your seller account has been rejected. Please contact support for more information.',
            success: false,
          },
          403
        );
      }
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: sanitizedPassword,
    });

    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        return createCorsResponse(
          { message: 'Please confirm your email before logging in', success: false },
          401
        );
      }

      if (authError.message.includes('Invalid login credentials')) {
        const response: any = {
          message: 'Invalid Email or Password',
          success: false,
        };

        // If password was changed recently, include the timestamp
        if (userData?.password_changed_at) {
          response.passwordChangedAt = userData.password_changed_at;
        }

        return createCorsResponse(response, 401);
      }

      return createCorsResponse(
        { message: 'Login failed', success: false },
        401
      );
    }

    if (!authData.user) {
      return createCorsResponse(
        { message: 'Login failed', success: false },
        401
      );
    }

    return createCorsResponse({
      success: true,
      message: 'Login successful',
      role: userData.role || 'user',
      user: authData.user,
    });
  });
});
