import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddProduct from "@/models/AddProduct";

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json(
        { message: "Username is required" },
        { status: 400 }
      );
    }
    
    const products = await AddProduct.find({ sellerUsername: username }).sort({ createdAt: -1 }); 
    
    return NextResponse.json({ products, count: products.length });
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}