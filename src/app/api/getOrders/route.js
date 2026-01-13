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

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Get orders error:", error);
      return NextResponse.json({ 
        message: "Server error", 
        error: error.message 
      }, { status: 500 });
    }

    const ordersWithImages = await Promise.all(
      (orders || []).map(async (order) => {
        if (order.id_url) {
          return order;
        }
        
        try {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('id_url')
            .eq('product_id', order.product_id)
            .single();

          if (productError) {
            console.error(`Error fetching product image for order ${order.id}:`, productError);
            return {
              ...order,
              id_url: null,
            };
          }

          return {
            ...order,
            id_url: product?.id_url || null,
          };
        } catch (err) {
          console.error(`Error processing order ${order.id}:`, err);
          return {
            ...order,
            id_url: null,
          };
        }
      })
    );

    return NextResponse.json({ 
      orders: ordersWithImages || [],
      count: ordersWithImages?.length || 0 
    }, { status: 200 });
  } catch (err) {
    console.error("Get orders error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}
