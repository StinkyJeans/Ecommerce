import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../../_shared/cors.ts';
import {
  sanitizeString,
  validateLength,
  isValidPrice,
  isValidImageUrl,
} from '../../_shared/validation.ts';
import { requireRole } from '../../_shared/auth.ts';
import { handleAsyncError } from '../../_shared/errors.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  return handleAsyncError(async () => {
    const authResult = await requireRole(req, 'seller');
    if (!authResult.authenticated) {
      return authResult.response;
    }
    const { supabase, userData } = authResult;
    const { productName, description, price, category, idUrl, username } = await req.json();
    if (!productName || !description || !price || !category || !idUrl || !username) {
      return createCorsResponse(
        { message: 'All fields are required', success: false },
        400
      );
    }
    if (userData.username !== username && userData.role !== 'admin') {
      return createCorsResponse(
        { message: 'Forbidden: You can only add products to your own account', success: false },
        403
      );
    }
    const sanitizedProductName = sanitizeString(productName, 200);
    const sanitizedDescription = sanitizeString(description, 1000);
    const sanitizedCategory = sanitizeString(category, 50);
    const sanitizedUsername = sanitizeString(username, 50);
    if (!validateLength(sanitizedProductName, 2, 200)) {
      return createCorsResponse(
        { message: 'Product name must be between 2 and 200 characters', success: false },
        400
      );
    }
    if (!validateLength(sanitizedDescription, 10, 1000)) {
      return createCorsResponse(
        { message: 'Description must be between 10 and 1000 characters', success: false },
        400
      );
    }
    if (!isValidPrice(price)) {
      return createCorsResponse(
        { message: 'Invalid price format', success: false },
        400
      );
    }
    if (!isValidImageUrl(idUrl)) {
      return createCorsResponse(
        { message: 'Invalid image URL format', success: false },
        400
      );
    }
    let productId: string;
    const { data: productIdData, error: productIdError } = await supabase.rpc(
      'generate_product_id'
    );
    if (productIdError || !productIdData) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9).toUpperCase();
      productId = `PROD-${timestamp}-${random}`;
    } else {
      productId = productIdData;
    }
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        product_id: productId,
        seller_username: sanitizedUsername,
        product_name: sanitizedProductName,
        description: sanitizedDescription,
        price: typeof price === 'number' ? price.toString() : price,
        category: sanitizedCategory,
        id_url: idUrl,
      })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') {
        return createCorsResponse(
          { message: 'Product name already taken', success: false },
          409
        );
      }
      return createCorsResponse(
        { message: 'Failed to add product', success: false },
        500
      );
    }
    return createCorsResponse(
      {
        success: true,
        message: 'Product added successfully!',
        productId: newProduct.product_id,
      },
      201
    );
  });
});