import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, items, shipping_address_id, payment_method, delivery_option } = body;

    if (!username || !items || items.length === 0) {
      return NextResponse.json({ 
        message: "Username and items are required." 
      }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
    }

    const orders = [];
    const cartItemIds = [];

    for (const item of items) {
      const price = parseFloat(item.price || 0);
      const quantity = item.quantity || 1;
      const totalAmount = price * quantity;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          username: username,
          seller_username: item.seller_username || 'Unknown',
          product_id: item.product_id,
          product_name: item.product_name,
          price: price,
          quantity: quantity,
          total_amount: totalAmount,
          status: 'pending',
          id_url: item.id_url || null
        })
        .select()
        .single();

      if (orderError) {
        console.error("Create order error:", orderError);
        return NextResponse.json({ 
          message: "Failed to create order", 
          error: orderError.message 
        }, { status: 500 });
      }

      orders.push(order);
      cartItemIds.push(item.id);
    }

    for (const cartItemId of cartItemIds) {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);

      if (deleteError) {
        console.error("Delete cart item error:", deleteError);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Order created successfully",
      orders: orders
    }, { status: 200 });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}
