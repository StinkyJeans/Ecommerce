import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddProduct from "@/models/AddProduct";

export async function GET() {
  try {
    await connectDB();
    const products = await AddProduct.find().sort({ createdAt: -1 }); // latest first
    return NextResponse.json({ products });
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
