import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleCors, createCorsResponse } from '../../_shared/cors.ts';
import { sanitizeString } from '../../_shared/validation.ts';
import { handleAsyncError } from '../../_shared/errors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  return handleAsyncError(async () => {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');

    if (!category) {
      return createCorsResponse(
        { message: 'Category parameter is required', success: false },
        400
      );
    }

    const sanitizedCategory = sanitizeString(category, 50);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', sanitizedCategory)
      .order('created_at', { ascending: false });

    if (error) {
      return createCorsResponse(
        { message: 'Failed to fetch products', success: false },
        500
      );
    }

    const transformedProducts = (products || []).map((product) => ({
      ...product,
      productId: product.product_id,
      productName: product.product_name,
      idUrl: product.id_url,
      sellerUsername: product.seller_username,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));

    return createCorsResponse({
      success: true,
      products: transformedProducts,
      count: transformedProducts.length,
    });
  });
});
