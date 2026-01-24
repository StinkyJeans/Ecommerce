import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { sanitizeString } from '../_shared/validation.ts';
import { handleAsyncError } from '../_shared/errors.ts';
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
    const url = new URL(req.url);
    const username = sanitizeString(url.searchParams.get('username'), 50);
    if (!username) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['Username is required'], success: false },
        400
      );
    }
    if (authResult.userData.username !== username && authResult.userData.email !== username) {
      return createCorsResponse(
        { message: 'Forbidden', error: 'You do not have permission to access this resource', success: false },
        403
      );
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: cart, error } = await supabase.rpc('get_cart_with_sellers', {
      p_username: username,
    });
    if (error) {
      const { data: cartItems, error: cartError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('username', username)
        .order('created_at', { ascending: false });
      if (cartError) {
        return createCorsResponse(
          { message: 'Server error', success: false },
          500
        );
      }
      const cartWithSellers = await Promise.all(
        (cartItems || []).map(async (item: any) => {
          const { data: product } = await supabase
            .from('products')
            .select('seller_username')
            .eq('product_id', item.product_id)
            .single();
          return {
            ...item,
            idUrl: item.id_url,
            productName: item.product_name,
            seller_username: product?.seller_username || 'Unknown',
          };
        })
      );
      return createCorsResponse({
        cart: cartWithSellers,
        count: cartWithSellers.length,
      });
    }
    const transformedCart = (cart || []).map((item: any) => ({
      ...item,
      idUrl: item.id_url,
      productName: item.product_name,
    }));
    return createCorsResponse({
      cart: transformedCart,
      count: transformedCart.length,
    });
  });
});