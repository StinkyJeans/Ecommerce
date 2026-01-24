import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../../_shared/cors.ts';
import { requireAuth } from '../../_shared/auth.ts';
import { handleAsyncError } from '../../_shared/errors.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  return handleAsyncError(async () => {
    const authResult = await requireAuth(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    const { supabase, userData } = authResult;
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_changed_at: new Date().toISOString() })
      .eq('email', userData.email);
    if (updateError) {
      return createCorsResponse(
        { message: 'Failed to update password changed timestamp', success: false },
        500
      );
    }
    return createCorsResponse({
      success: true,
      message: 'Password changed timestamp updated successfully',
    });
  });
});