import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddToCart from "@/models/AddToCart";

export async function POST(req) {
  try {
    const { username, productName, description, price, idUrl } = await req.json();

    // Validate all required fields including username
    if (!username || !productName || !description || !price || !idUrl) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    await connectDB();

    // Check if this user already has this product in their cart
    const existing = await AddToCart.findOne({ username, productName });
    if (existing) {
      return NextResponse.json({ message: "Product already in cart." }, { status: 409 });
    }

    // Create cart item with username
    await AddToCart.create({ username, productName, description, price, idUrl });

    return NextResponse.json({ message: "Product added to cart successfully!" }, { status: 201 });
  } catch (err) {
    console.error("Add to cart error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}