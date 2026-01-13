import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ message: "Username is required." }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: cart, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Get cart error:", error);
      return NextResponse.json({ 
        message: "Server error", 
        error: error.message 
      }, { status: 500 });
    }

    const cartWithSellers = await Promise.all(
      (cart || []).map(async (item) => {
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

    return NextResponse.json({ 
      cart: cartWithSellers,
      count: cartWithSellers.length 
    }, { status: 200 });
  } catch (err) {
    console.error("Get cart error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}