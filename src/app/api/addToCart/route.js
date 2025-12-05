import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddToCart from "@/models/AddToCart";

export async function POST(req) {
  try {
    const { username, productId, productName, description, price, idUrl, quantity } = await req.json();

    // Validate required fields including productId
    if (!username || !productId || !productName || !description || !price || !idUrl) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    await connectDB();

    // Check if product already exists in cart using productId
    const existing = await AddToCart.findOne({ username, productId });
    if (existing) {
      existing.quantity += (quantity || 1);
      await existing.save();
      return NextResponse.json({ 
        message: "Product quantity updated in cart!", 
        updated: true,
        quantity: existing.quantity
      }, { status: 200 });
    }

    // Convert price to string if it's a number
    const priceString = typeof price === 'number' ? price.toString() : price;

    // Create new cart item with productId
    const cartItem = await AddToCart.create({ 
      username,
      productId,      // Include productId
      productName, 
      description, 
      price: priceString, 
      idUrl,
      quantity: quantity || 1
    });

    return NextResponse.json({ 
      message: "Product added to cart successfully!",
      cartItem: {
        productId: cartItem.productId,
        productName: cartItem.productName,
        quantity: cartItem.quantity
      }
    }, { status: 201 });
  } catch (err) {
    console.error("Add to cart error:", err);
    
    // Handle duplicate key error
    if (err.code === 11000) {
      return NextResponse.json(
        { message: "Product already in cart." },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}