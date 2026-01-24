import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../../_shared/cors.ts';
import { requireRole } from '../../_shared/auth.ts';
import { handleAsyncError } from '../../_shared/errors.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  return handleAsyncError(async () => {
    const authResult = await requireRole(req, 'admin');
    if (!authResult.authenticated) {
      return authResult.response;
    }
    const { supabase } = authResult;
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, contact, created_at')
      .eq('role', 'user')
      .order('created_at', { ascending: false });
    if (error) {
      return createCorsResponse(
        { message: 'Failed to fetch users', success: false },
        500
      );
    }
    return createCorsResponse({
      success: true,
      users: users || [],
    });
  });
});