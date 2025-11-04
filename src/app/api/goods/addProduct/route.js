import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddProduct from "@/models/AddProduct";

export async function POST(req) {
  try {
    const { productName, description, price, category, idUrl, username } = await req.json();

    if (!productName || !description || !price || !category || !idUrl || !username) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    await connectDB();

    await AddProduct.create({
      username,     
      productName,
      description,
      price,
      category,
      idUrl,
    });

    return NextResponse.json({ message: "Product added successfully!" }, { status: 201 });
  } catch (err) {
    console.error("product adding error:", err);

    if (err.code === 11000) {
      return NextResponse.json(
        { message: "Product name already taken." },
        { status: 409 }
      );
    }

    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}