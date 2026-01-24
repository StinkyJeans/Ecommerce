import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../../_shared/cors.ts';
import { sanitizeString } from '../../_shared/validation.ts';
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
    const url = new URL(req.url);
    const id = sanitizeString(url.searchParams.get('id'), 100);
    const username = sanitizeString(url.searchParams.get('username') || userData.username, 50);
    if (!id || !username) {
      return createCorsResponse(
        { message: 'Missing id or username', success: false },
        400
      );
    }
    if (userData.username !== username && userData.role !== 'admin') {
      return createCorsResponse(
        { message: 'Forbidden: You can only remove items from your own cart', success: false },
        403
      );
    }
    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, username')
      .eq('id', id)
      .single();
    if (fetchError || !cartItem) {
      return createCorsResponse(
        { message: 'Item not found', success: false },
        404
      );
    }
    if (cartItem.username !== username && userData.role !== 'admin') {
      return createCorsResponse(
        { message: 'Forbidden: You do not have permission to remove this cart item', success: false },
        403
      );
    }
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id);
    if (deleteError) {
      return createCorsResponse(
        { message: 'Failed to remove item', success: false },
        500
      );
    }
    return createCorsResponse({
      success: true,
      message: 'Item removed successfully',
    });
  });
});