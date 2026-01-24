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
    const action = sanitizeString(url.searchParams.get('action'), 20);
    const username = sanitizeString(url.searchParams.get('username') || userData.username, 50);
    if (!id || !action || !username) {
      return createCorsResponse(
        { message: 'Missing required parameters', success: false },
        400
      );
    }
    if (action !== 'increase' && action !== 'decrease') {
      return createCorsResponse(
        { message: "Invalid action. Must be 'increase' or 'decrease'", success: false },
        400
      );
    }
    if (userData.username !== username && userData.role !== 'admin') {
      return createCorsResponse(
        { message: 'Forbidden: You can only modify your own cart', success: false },
        403
      );
    }
    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', id)
      .eq('username', username)
      .single();
    if (fetchError || !cartItem) {
      return createCorsResponse(
        { message: 'Cart item not found', success: false },
        404
      );
    }
    if (cartItem.username !== username && userData.role !== 'admin') {
      return createCorsResponse(
        { message: 'Forbidden: You do not have permission to modify this cart item', success: false },
        403
      );
    }
    if (action === 'increase') {
      const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: cartItem.quantity + 1 })
        .eq('id', id)
        .select()
        .single();
      if (updateError) {
        return createCorsResponse(
          { message: 'Failed to update quantity', success: false },
          500
        );
      }
      return createCorsResponse({
        success: true,
        message: 'Quantity updated successfully',
        cartItem: updated,
      });
    } else if (action === 'decrease') {
      if (cartItem.quantity > 1) {
        const { data: updated, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: cartItem.quantity - 1 })
          .eq('id', id)
          .select()
          .single();
        if (updateError) {
          return createCorsResponse(
            { message: 'Failed to update quantity', success: false },
            500
          );
        }
        return createCorsResponse({
          success: true,
          message: 'Quantity updated successfully',
          cartItem: updated,
        });
      } else {
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
          message: 'Item removed from cart',
          removed: true,
        });
      }
    }
    return createCorsResponse(
      { message: 'Invalid action', success: false },
      400
    );
  });
});