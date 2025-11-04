import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddToCart from "@/models/AddToCart";

export async function POST(req) {
  try {
    const { username, productName, description, price, idUrl } = await req.json();

    // console.log("=== ADD TO CART REQUEST ===");
    // console.log("Username:", username);
    // console.log("Product:", productName);
    // console.log("Price:", price, "Type:", typeof price);

    if (!username || !productName || !description || !price || !idUrl) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    await connectDB();

    const existing = await AddToCart.findOne({ username, productName });
    if (existing) {
      return NextResponse.json({ message: "Product already in cart." }, { status: 409 });
    }

    const priceString = typeof price === 'number' ? price.toString() : price;

    const cartItem = await AddToCart.create({ 
      username, 
      productName, 
      description, 
      price: priceString, 
      idUrl 
    });

    // console.log("Cart item created:", cartItem);

    return NextResponse.json({ message: "Product added to cart successfully!" }, { status: 201 });
  } catch (err) {
    console.error("Add to cart error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}