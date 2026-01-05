import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import AddProduct from "@/models/AddProduct";

// Function to generate unique product ID
function generateProductId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `PROD-${timestamp}-${random}`;
}

export async function POST(req) {
  try {
    const { productName, description, price, category, idUrl, username } = await req.json();

    if (!productName || !description || !price || !category || !idUrl || !username) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    await connectDB();

    // Generate the product ID
    const productId = generateProductId();

    const newProduct = await AddProduct.create({
      productId,      // Add the generated productId
      sellerUsername: username,     
      productName,
      description,
      price,
      category,
      idUrl,
    });

    return NextResponse.json({ 
      message: "Product added successfully!", 
      productId: newProduct.productId 
    }, { status: 201 });
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