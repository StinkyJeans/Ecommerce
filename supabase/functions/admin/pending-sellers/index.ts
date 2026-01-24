import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors, createCorsResponse } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  try {
    const authResult = await requireRole(req, 'admin');
    if (!authResult.authenticated) {
      return authResult.response;
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: pendingSellers, error } = await supabase
      .from('users')
      .select('id, username, email, contact, id_url, created_at')
      .eq('role', 'seller')
      .eq('seller_status', 'pending')
      .order('created_at', { ascending: false });
    if (error) {
      return createCorsResponse(
        { message: 'Server error', success: false },
        500
      );
    }
    return createCorsResponse({
      success: true,
      pendingSellers: pendingSellers || [],
    });
  } catch (error) {
    return createCorsResponse(
      { message: 'Server error', success: false },
      500
    );
  }
});