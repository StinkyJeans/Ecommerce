import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../../_shared/cors.ts';
import { sanitizeString, isValidQuantity, isValidPrice } from '../../_shared/validation.ts';
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
    const body = await req.json();
    const username = sanitizeString(body.username || userData.username, 50);
    const items = body.items;
    const shipping_address_id = body.shipping_address_id;
    const payment_method = body.payment_method;
    const delivery_option = body.delivery_option;
    if (!username || !items || !Array.isArray(items) || items.length === 0) {
      return createCorsResponse(
        { message: 'Username and items are required', success: false },
        400
      );
    }
    if (userData.username !== username && userData.role !== 'admin') {
      return createCorsResponse(
        { message: 'Forbidden: You can only checkout your own cart', success: false },
        403
      );
    }
    for (const item of items) {
      if (!item.product_id || !item.product_name || item.price === null || item.price === undefined) {
        return createCorsResponse(
          { message: 'Invalid item data', success: false },
          400
        );
      }
      if (!isValidPrice(item.price)) {
        return createCorsResponse(
          { message: 'Invalid price in item', success: false },
          400
        );
      }
      if (!isValidQuantity(item.quantity)) {
        return createCorsResponse(
          { message: 'Invalid quantity in item', success: false },
          400
        );
      }
    }
    const orders = [];
    const cartItemIds = [];
    for (const item of items) {
      const price = parseFloat(item.price || 0);
      const quantity = item.quantity || 1;
      const totalAmount = price * quantity;
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          username: username,
          seller_username: item.seller_username || 'Unknown',
          product_id: item.product_id,
          product_name: item.product_name,
          price: price,
          quantity: quantity,
          total_amount: totalAmount,
          status: 'pending',
          id_url: item.id_url || null,
        })
        .select()
        .single();
      if (orderError) {
        return createCorsResponse(
          { message: 'Failed to create order', success: false },
          500
        );
      }
      orders.push(order);
      cartItemIds.push(item.id);
    }
    for (const cartItemId of cartItemIds) {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);
      if (deleteError) {
        console.error('Failed to remove cart item:', deleteError);
      }
    }
    return createCorsResponse({
      success: true,
      message: 'Order created successfully',
      orders: orders,
    });
  });
});