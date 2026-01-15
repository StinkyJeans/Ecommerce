import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../../_shared/cors.ts';
import {
  sanitizeString,
  validateLength,
  isValidPrice,
  isValidQuantity,
  isValidImageUrl,
} from '../../_shared/validation.ts';
import { requireAuth } from '../../_shared/auth.ts';
import { handleAsyncError } from '../../_shared/errors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  return handleAsyncError(async () => {
    // Require authentication
    const authResult = await requireAuth(req);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { supabase, userData } = authResult;

    const body = await req.json();

    // Sanitize inputs
    const username = sanitizeString(body.username || userData.username, 50);
    const product_id = sanitizeString(body.productId || body.product_id, 100);
    const product_name = sanitizeString(body.productName || body.product_name, 200);
    const description = sanitizeString(body.description, 1000);
    const price = body.price;
    const id_url = sanitizeString(body.idUrl || body.id_url, 500);
    const quantity = body.quantity || 1;

    // Verify ownership - user can only add to their own cart
    if (userData.username !== username && userData.role !== 'admin') {
      return createCorsResponse(
        { message: 'Forbidden: You can only add items to your own cart', success: false },
        403
      );
    }

    // Input validation
    if (!username || !product_id || !product_name || !description || price === null || price === undefined || !id_url) {
      return createCorsResponse(
        { message: 'All fields are required', success: false },
        400
      );
    }

    // Validate inputs
    if (!validateLength(product_id, 1, 100)) {
      return createCorsResponse(
        { message: 'Product ID must be between 1 and 100 characters', success: false },
        400
      );
    }
    if (!validateLength(product_name, 1, 200)) {
      return createCorsResponse(
        { message: 'Product name must be between 1 and 200 characters', success: false },
        400
      );
    }
    if (!validateLength(description, 1, 1000)) {
      return createCorsResponse(
        { message: 'Description must be between 1 and 1000 characters', success: false },
        400
      );
    }
    if (!isValidPrice(price)) {
      return createCorsResponse(
        { message: 'Invalid price format', success: false },
        400
      );
    }
    if (!isValidImageUrl(id_url)) {
      return createCorsResponse(
        { message: 'Invalid image URL format', success: false },
        400
      );
    }
    if (!isValidQuantity(quantity)) {
      return createCorsResponse(
        { message: 'Quantity must be a positive integer', success: false },
        400
      );
    }

    // Check if item already exists in cart
    const { data: existing, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('username', username)
      .eq('product_id', product_id)
      .single();

    if (existing && !fetchError) {
      // Update quantity
      const newQuantity = existing.quantity + (quantity || 1);
      const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        return createCorsResponse(
          { message: 'Failed to update cart', success: false },
          500
        );
      }

      return createCorsResponse({
        success: true,
        message: 'Product quantity updated in cart!',
        updated: true,
        quantity: updated.quantity,
      });
    }

    // Insert new cart item
    const priceString = typeof price === 'number' ? price.toString() : price;

    const { data: cartItem, error: insertError } = await supabase
      .from('cart_items')
      .insert({
        username,
        product_id: product_id,
        product_name: product_name,
        description: description,
        price: priceString,
        id_url: id_url,
        quantity: quantity || 1,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return createCorsResponse(
          { message: 'Product already in cart', success: false },
          409
        );
      }

      return createCorsResponse(
        { message: 'Failed to add item to cart', success: false },
        500
      );
    }

    return createCorsResponse({
      success: true,
      message: 'Product added to cart successfully!',
      cartItem,
    });
  });
});
