import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const category = sanitizeString(searchParams.get('category'), 50);
    
    if (!category) {
      return createValidationErrorResponse("Category parameter is required");
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
    
    if (error) {
      return handleError(error, 'getProductByCategory');
    }
    
    const transformedProducts = (products || []).map(product => ({
      ...product,
      productId: product.product_id,
      productName: product.product_name,
      idUrl: product.id_url,
      sellerUsername: product.seller_username,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));
    
    const response = NextResponse.json({ products: transformedProducts, category });
    
    // Add cache headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    
    return response;
  } catch (err) {
    return handleError(err, 'getProductByCategory');
  }
}