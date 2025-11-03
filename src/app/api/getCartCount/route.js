// src/app/api/getCartCount/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddToCart from "@/models/AddToCart"; // Import AddToCart model

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json({ count: 0 });
    }
    
    // Count the number of items in the user's cart
    const count = await AddToCart.countDocuments({ username });
    
    return NextResponse.json({ count });
  } catch (err) {
    console.error("Failed to fetch cart count:", err);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}