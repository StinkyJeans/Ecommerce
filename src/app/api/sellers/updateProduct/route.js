import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req) {
  try {
    const { productId, productName, description, price, category, idUrl, username } = await req.json();

    if (!productId || !productName || !description || !price || !category || !username) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('username, role')
      .eq('email', user.email)
      .single();

    if (!userData || (userData.role !== 'seller' && userData.role !== 'admin')) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    if (userData.role === 'seller' && userData.username !== username) {
      return NextResponse.json({ message: "You can only edit your own products" }, { status: 403 });
    }

    const updateData = {
      product_name: productName,
      description: description,
      price: price,
      category: category,
    };

    if (idUrl) {
      updateData.id_url = idUrl;
    }

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('product_id', productId)
      .eq('seller_username', username)
      .select()
      .single();

    if (error) {
      console.error("product update error:", error);
      
      if (error.code === '23505') {
        return NextResponse.json(
          { message: "Product name already taken." },
          { status: 409 }
        );
      }

      return NextResponse.json({ message: "Failed to update product" }, { status: 500 });
    }

    if (!updatedProduct) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Product updated successfully!", 
      product: updatedProduct 
    }, { status: 200 });
  } catch (err) {
    console.error("product update error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
