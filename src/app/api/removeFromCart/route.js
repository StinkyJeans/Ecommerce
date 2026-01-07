import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const username = searchParams.get("username");

    console.log("=== DELETE REQUEST ===");
    console.log("ID:", id);
    console.log("Username:", username);

    if (!id || !username) {
      return NextResponse.json({ 
        success: false,
        message: "Missing id or username" 
      }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, username')
      .eq('id', id)
      .single();

    if (fetchError || !cartItem) {
      return NextResponse.json({ 
        success: false,
        message: "Item not found" 
      }, { status: 404 });
    }

    if (cartItem.username !== username) {
      return NextResponse.json({ 
        success: false,
        message: "Unauthorized" 
      }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("=== DELETE ERROR ===");
      console.error(deleteError);
      return NextResponse.json({ 
        success: false,
        message: "Server error", 
        error: deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Item removed successfully" 
    }, { status: 200 });

  } catch (error) {
    console.error("=== DELETE ERROR ===");
    console.error(error);
    return NextResponse.json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    }, { status: 500 });
  }
}