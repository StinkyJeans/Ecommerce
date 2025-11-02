import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddToCart from "@/models/AddToCart";

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

    await connectDB();
    
    // Try to find and delete the item
    const deletedItem = await AddToCart.findByIdAndDelete(id);

    console.log("Deleted item:", deletedItem);

    if (!deletedItem) {
      return NextResponse.json({ 
        success: false,
        message: "Item not found" 
      }, { status: 404 });
    }

    // If item has username field, verify it matches
    if (deletedItem.username && deletedItem.username !== username) {
      // Oops, deleted wrong user's item - restore it
      await AddToCart.create(deletedItem);
      return NextResponse.json({ 
        success: false,
        message: "Unauthorized" 
      }, { status: 403 });
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