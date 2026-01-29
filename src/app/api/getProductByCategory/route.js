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
    
    // Simple query first - get products by category
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
    
    if (error) {
      return handleError(error, 'getProductByCategory');
    }
    
    // Get approved sellers (handle gracefully if column doesn't exist)
    let approvedSellerUsernames = null;
    try {
      const { data: approvedSellers, error: sellersError } = await supabase
        .from('users')
        .select('username')
        .eq('role', 'seller')
        .eq('seller_status', 'approved');
      
      if (!sellersError && approvedSellers) {
        approvedSellerUsernames = new Set(approvedSellers.map(s => s.username));
      }
    } catch (err) {
      // seller_status column might not exist, continue without filtering
      console.log('Could not filter by seller_status:', err.message);
    }
    
    // Filter products in memory
    let filteredProducts = products || [];
    
    // Filter by approved sellers if we have the list
    if (approvedSellerUsernames && approvedSellerUsernames.size > 0) {
      filteredProducts = filteredProducts.filter(p => approvedSellerUsernames.has(p.seller_username));
    }
    
    // Filter by is_available if column exists
    filteredProducts = filteredProducts.filter(p => {
      if (p.is_available !== undefined) {
        return p.is_available === true;
      }
      return true; // Include if column doesn't exist
    });
    
    // Transform products
    const transformedProducts = filteredProducts.map(product => ({
      ...product,
      productId: product.product_id,
      productName: product.product_name,
      idUrl: product.id_url,
      sellerUsername: product.seller_username,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));
    
    const response = NextResponse.json({ products: transformedProducts, category });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (err) {
    console.error('Category product fetch error:', err);
    return handleError(err, 'getProductByCategory');
  }
}