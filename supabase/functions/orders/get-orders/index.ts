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

    // Input validation
    if (!username) {
      return createCorsResponse(
        { message: 'Validation failed', errors: ['Username is required'], success: false },
        400
      );
    }

    // Verify ownership
    if (authResult.userData.username !== username && authResult.userData.email !== username) {
      return createCorsResponse(
        { message: 'Forbidden', error: 'You do not have permission to access this resource', success: false },
        403
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Use database function to get orders with images
    const { data: orders, error } = await supabase.rpc('get_user_orders', {
      p_username: username,
    });

    if (error) {
      // Fallback to manual query
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('username', username)
        .order('created_at', { ascending: false });

      if (ordersError) {
        return createCorsResponse(
          { message: 'Server error', success: false },
          500
        );
      }

      const ordersWithImages = await Promise.all(
        (ordersData || []).map(async (order: any) => {
          if (order.id_url) {
            return order;
          }

          try {
            const { data: product } = await supabase
              .from('products')
              .select('id_url')
              .eq('product_id', order.product_id)
              .single();

            return {
              ...order,
              id_url: product?.id_url || null,
            };
          } catch (err) {
            return {
              ...order,
              id_url: null,
            };
          }
        })
      );

      return createCorsResponse({
        orders: ordersWithImages || [],
        count: ordersWithImages?.length || 0,
      });
    }

    return createCorsResponse({
      orders: orders || [],
      count: orders?.length || 0,
    });
  });
});
