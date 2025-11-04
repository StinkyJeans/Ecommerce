import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddProduct from "@/models/AddProduct";

export async function GET(request) {
  try {
    await connectDB();

    const products = await AddProduct.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      success: true,
      products, 
      count: products.length 
    });
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return NextResponse.json(
      { message: "Server error", success: false },
      { status: 500 }
    );
  }
}