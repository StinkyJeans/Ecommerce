import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole, verifySellerOwnership } from "@/lib/auth";
import { sanitizeString, validateLength, isValidPrice, isValidImageUrl } from "@/lib/validation";
import { createValidationErrorResponse, handleError, createForbiddenResponse } from "@/lib/errors";

export async function PUT(req) {
  try {
    // Authentication check - must be seller or admin
    const authResult = await requireRole(['seller', 'admin']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;

    const { productId, productName, description, price, category, idUrl, username } = await req.json();

    // Input validation
    if (!productId || !productName || !description || !price || !category || !username) {
      return createValidationErrorResponse("All fields are required");
    }

    // Sanitize inputs
    const sanitizedProductId = sanitizeString(productId, 100);
    const sanitizedProductName = sanitizeString(productName, 200);
    const sanitizedDescription = sanitizeString(description, 1000);
    const sanitizedCategory = sanitizeString(category, 50);
    const sanitizedUsername = sanitizeString(username, 50);

    // Verify ownership for sellers (admins can edit any product)
    if (userData.role === 'seller') {
      const ownershipCheck = await verifySellerOwnership(sanitizedUsername);
      if (ownershipCheck instanceof NextResponse) {
        return ownershipCheck;
      }
    }

    // Validate inputs
    if (!validateLength(sanitizedProductName, 2, 200)) {
      return createValidationErrorResponse("Product name must be between 2 and 200 characters");
    }
    if (!validateLength(sanitizedDescription, 10, 1000)) {
      return createValidationErrorResponse("Description must be between 10 and 1000 characters");
    }
    if (!isValidPrice(price)) {
      return createValidationErrorResponse("Invalid price format");
    }
    if (idUrl && !isValidImageUrl(idUrl)) {
      return createValidationErrorResponse("Invalid image URL format");
    }

    const supabase = await createClient();

    const updateData = {
      product_name: sanitizedProductName,
      description: sanitizedDescription,
      price: typeof price === 'number' ? price.toString() : price,
      category: sanitizedCategory,
    };

    if (idUrl) {
      updateData.id_url = idUrl;
    }

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('product_id', sanitizedProductId)
      .eq('seller_username', sanitizedUsername)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { message: "Product name already taken." },
          { status: 409 }
        );
      }

      return handleError(error, 'updateProduct');
    }

    if (!updatedProduct) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Product updated successfully!", 
      product: updatedProduct 
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'updateProduct');
  }
}
