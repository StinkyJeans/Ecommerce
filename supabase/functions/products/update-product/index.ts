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
    // Require seller or admin role
    const authResult = await requireRole(req, ['seller', 'admin']);
    if (!authResult.authenticated) {
      return authResult.response;
    }

    const { supabase, userData } = authResult;

    const { productId, productName, description, price, category, idUrl, username } = await req.json();

    // Input validation
    if (!productId || !productName || !description || !price || !category || !username) {
      return createCorsResponse(
        { message: 'All fields are required', success: false },
        400
      );
    }

    // Verify ownership for sellers (admins can edit any product)
    if (userData.role === 'seller' && userData.username !== username) {
      return createCorsResponse(
        { message: 'Forbidden: You can only edit your own products', success: false },
        403
      );
    }

    // Sanitize inputs
    const sanitizedProductId = sanitizeString(productId, 100);
    const sanitizedProductName = sanitizeString(productName, 200);
    const sanitizedDescription = sanitizeString(description, 1000);
    const sanitizedCategory = sanitizeString(category, 50);
    const sanitizedUsername = sanitizeString(username, 50);

    // Validate inputs
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
    if (idUrl && !isValidImageUrl(idUrl)) {
      return createCorsResponse(
        { message: 'Invalid image URL format', success: false },
        400
      );
    }

    const updateData: any = {
      product_name: sanitizedProductName,
      description: sanitizedDescription,
      price: typeof price === 'number' ? price.toString() : price,
      category: sanitizedCategory,
    };

    if (idUrl) {
      updateData.id_url = idUrl;
    }

    // Build query - sellers can only update their own products
    let query = supabase
      .from('products')
      .update(updateData)
      .eq('product_id', sanitizedProductId);

    if (userData.role === 'seller') {
      query = query.eq('seller_username', sanitizedUsername);
    }

    const { data: updatedProduct, error } = await query.select().single();

    if (error) {
      if (error.code === '23505') {
        return createCorsResponse(
          { message: 'Product name already taken', success: false },
          409
        );
      }

      return createCorsResponse(
        { message: 'Failed to update product', success: false },
        500
      );
    }

    if (!updatedProduct) {
      return createCorsResponse(
        { message: 'Product not found', success: false },
        404
      );
    }

    return createCorsResponse({
      success: true,
      message: 'Product updated successfully!',
      product: updatedProduct,
    });
  });
});
