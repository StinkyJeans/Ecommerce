// src/app/api/getProductByCategory/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddProduct from "@/models/AddProduct";

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    if (!category) {
      return NextResponse.json(
        { message: "Category parameter is required" }, 
        { status: 400 }
      );
    }

    const products = await AddProduct.find({ category }).sort({ createdAt: -1 });
    
    return NextResponse.json({ products, category });
  } catch (err) {
    console.error("Failed to fetch products by category:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}