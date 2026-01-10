import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json(
        { message: "Username is required" },
        { status: 400 }
      );
    }
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_username', username)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Failed to fetch products:", error);
      return NextResponse.json(
        { message: "Server error" },
        { status: 500 }
      );
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
    
    return NextResponse.json({ success: true, products: transformedProducts, count: transformedProducts.length });
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}