import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddToCart from "@/models/AddToCart";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ message: "Username is required." }, { status: 400 });
    }

    await connectDB();

    const cart = await AddToCart.find({ username }).sort({ createdAt: -1 });

    return NextResponse.json({ 
      cart,
      count: cart.length 
    }, { status: 200 });
  } catch (err) {
    console.error("Get cart error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}