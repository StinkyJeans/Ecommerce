import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const supabase = await createClient();

    const productId = generateProductId();

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        product_id: productId,
        seller_username: username,
        product_name: productName,
        description: description,
        price: price,
        category: category,
        id_url: idUrl,
      })
      .select()
      .single();

    if (error) {
      console.error("product adding error:", error);
      
      if (error.code === '23505') {
        return NextResponse.json(
          { message: "Product name already taken." },
          { status: 409 }
        );
      }

      return NextResponse.json({ message: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Product added successfully!", 
      productId: newProduct.product_id 
    }, { status: 201 });
  } catch (err) {
    console.error("product adding error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}