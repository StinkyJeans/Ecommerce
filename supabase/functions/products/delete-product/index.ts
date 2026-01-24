import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors, createCorsResponse } from '../_shared/cors.ts';
import { requireRole } from '../_shared/auth.ts';
import { sanitizeString } from '../_shared/validation.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  try {
    const authResult = await requireRole(req, ['seller', 'admin']);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    const url = new URL(req.url);
    const id = sanitizeString(url.searchParams.get('id'), 100);
    const username = sanitizeString(url.searchParams.get('username'), 50);
    if (!id || !username) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['Missing id or username'], success: false },
        400
      );
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, seller_username')
      .eq('id', id)
      .single();
    if (fetchError || !product) {
      return createCorsResponse(
        { success: false, message: 'Item not found' },
        404
      );
    }
    if (authResult.userData.role === 'seller' && product.seller_username !== username) {
      return createCorsResponse(
        { message: 'Forbidden', error: 'You can only delete your own products', success: false },
        403
      );
    }
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (deleteError) {
      return createCorsResponse(
        { message: 'Server error', success: false },
        500
      );
    }
    return createCorsResponse({
      success: true,
      message: 'Item removed successfully',
    });
  } catch (error) {
    return createCorsResponse(
      { message: 'Server error', success: false },
      500
    );
  }
});