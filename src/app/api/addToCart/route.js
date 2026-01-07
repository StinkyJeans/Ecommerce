import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const body = await req.json();
    
    const username = body.username;
    const product_id = body.productId || body.product_id;
    const product_name = body.productName || body.product_name;
    const description = body.description;
    const price = body.price;
    const id_url = body.idUrl || body.id_url;
    const quantity = body.quantity;
    
    console.log("Add to cart request body:", body);
    console.log("Parsed fields:", { username, product_id, product_name, description, price, id_url, quantity });

    if (!username || !product_id || !product_name || !description || !price || !id_url) {
      console.error("Missing fields:", { username: !!username, product_id: !!product_id, product_name: !!product_name, description: !!description, price: !!price, id_url: !!id_url });
      return NextResponse.json({ 
        message: "All fields are required.",
        received: { username: !!username, product_id: !!product_id, product_name: !!product_name, description: !!description, price: !!price, id_url: !!id_url }
      }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('username', username)
      .eq('product_id', product_id)
      .single();

    if (existing && !fetchError) {
      const newQuantity = existing.quantity + (quantity || 1);
      const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({ 
        message: "Product quantity updated in cart!", 
        updated: true,
        quantity: updated.quantity
      }, { status: 200 });
    }

    const priceString = typeof price === 'number' ? price.toString() : price;

    const { data: cartItem, error: insertError } = await supabase
      .from('cart_items')
      .insert({
        username,
        product_id: product_id,
        product_name: product_name,
        description: description,
        price: priceString,
        id_url: id_url,
        quantity: quantity || 1
      })
      .select()
      .single();

    if (insertError) {
      console.error("Add to cart error:", insertError);
      
      if (insertError.message && insertError.message.includes('row-level security')) {
        return NextResponse.json(
          { 
            message: "Permission denied. Please check RLS policies.",
            error: insertError.message,
            details: "The cart_items table RLS policy might be blocking the insert."
          },
          { status: 403 }
        );
      }
      
      if (insertError.code === '23505') {
        return NextResponse.json(
          { message: "Product already in cart." },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { 
          message: "Failed to add to cart",
          error: insertError.message,
          code: insertError.code,
          details: insertError
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Product added to cart successfully!",
      cartItem: {
        productId: cartItem.product_id,
        productName: cartItem.product_name,
        quantity: cartItem.quantity
      }
    }, { status: 201 });
  } catch (err) {
    console.error("Add to cart error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}