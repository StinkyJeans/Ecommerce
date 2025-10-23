import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddToCart from "@/models/AddToCart";

export async function POST(req) {
  try {
    const {  productName, description, price, idUrl } = await req.json();

    if ( !productName || !description || !price || !idUrl) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    await connectDB();

    const existing = await AddToCart.findOne({ productName });
    if (existing) {
      return NextResponse.json({ message: "Product already in cart." }, { status: 409 });
    }

    await AddToCart.create({ productName, description, price, idUrl });

    return NextResponse.json({ message: "Product added to cart successfully!" }, { status: 201 });
  } catch (err) {
    console.error("Add to cart error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
