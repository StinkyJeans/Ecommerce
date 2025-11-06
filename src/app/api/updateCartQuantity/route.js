import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddToCart from "@/models/AddToCart";

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

    await connectDB();

    const cartItem = await AddToCart.findOne({ _id: id, username });
    
    if (!cartItem) {
      return NextResponse.json({ 
        message: "Cart item not found",
        success: false 
      }, { status: 404 });
    }

    if (action === 'increase') {
      cartItem.quantity += 1;
    } else if (action === 'decrease') {
      if (cartItem.quantity > 1) {
        cartItem.quantity -= 1;
      } else {
        await AddToCart.findByIdAndDelete(id);
        return NextResponse.json({
          message: "Item removed from cart",
          success: true,
          removed: true
        });
      }
    }

    await cartItem.save();

    return NextResponse.json({
      message: "Quantity updated successfully",
      success: true,
      cartItem
    });
  } catch (err) {
    console.error("Update quantity error:", err);
    return NextResponse.json({ 
      message: "Server error",
      success: false,
      error: err.message 
    }, { status: 500 });
  }
}