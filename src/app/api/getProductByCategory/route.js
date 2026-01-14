import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    if (!category) {
      return NextResponse.json(
        { message: "Category parameter is required" }, 
        { status: 400 }
      );
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Failed to fetch products by category:", error);
      return NextResponse.json({ message: "Server error" }, { status: 500 });
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
    console.error("Failed to fetch products by category:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}