import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddProduct from "@/models/AddProduct";

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

    const deletedItem = await AddProduct.findByIdAndDelete(id);

    console.log("Deleted item:", deletedItem);

    if (!deletedItem) {
      return NextResponse.json({ 
        success: false,
        message: "Item not found" 
      }, { status: 404 });
    }

    if (deletedItem.sellerUsername && deletedItem.sellerUsername !== username) {
      await AddProduct.create(deletedItem);
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