import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddToCart from "@/models/AddToCart";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ message: "Missing username" }, { status: 400 });
    }

    await connectDB();
    const cartItems = await AddToCart.find({ username });

    return NextResponse.json({ success: true, cart: cartItems });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
