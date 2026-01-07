import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");
    const username = searchParams.get("username");

    if (!id || !action || !username) {
      return NextResponse.json({ 
        message: "Missing required parameters",
        success: false 
      }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', id)
      .eq('username', username)
      .single();
    
    if (fetchError || !cartItem) {
      return NextResponse.json({ 
        message: "Cart item not found",
        success: false 
      }, { status: 404 });
    }

    if (action === 'increase') {
      const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: cartItem.quantity + 1 })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        message: "Quantity updated successfully",
        success: true,
        cartItem: updated
      });
    } else if (action === 'decrease') {
      if (cartItem.quantity > 1) {
        const { data: updated, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: cartItem.quantity - 1 })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return NextResponse.json({
          message: "Quantity updated successfully",
          success: true,
          cartItem: updated
        });
      } else {
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', id);

        if (deleteError) {
          throw deleteError;
        }

        return NextResponse.json({
          message: "Item removed from cart",
          success: true,
          removed: true
        });
      }
    }

    return NextResponse.json({
      message: "Invalid action",
      success: false
    }, { status: 400 });
  } catch (err) {
    console.error("Update quantity error:", err);
    return NextResponse.json({ 
      message: "Server error",
      success: false,
      error: err.message 
    }, { status: 500 });
  }
}