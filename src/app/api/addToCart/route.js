import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddToCart from "@/models/AddToCart";

export async function POST(req) {
  try {
    const { username, productName, description, price, idUrl, quantity } = await req.json();

    if (!username || !productName || !description || !price || !idUrl) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    await connectDB();

    const existing = await AddToCart.findOne({ username, productName });
    if (existing) {
      existing.quantity += (quantity || 1);
      await existing.save();
      return NextResponse.json({ 
        message: "Product quantity updated in cart!", 
        updated: true 
      }, { status: 200 });
    }

    const priceString = typeof price === 'number' ? price.toString() : price;

    const cartItem = await AddToCart.create({ 
      username, 
      productName, 
      description, 
      price: priceString, 
      idUrl,
      quantity: quantity || 1
    });

    return NextResponse.json({ message: "Product added to cart successfully!" }, { status: 201 });
  } catch (err) {
    console.error("Add to cart error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}