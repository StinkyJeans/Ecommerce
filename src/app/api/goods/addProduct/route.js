import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole, verifyOwnership } from "@/lib/auth";
import { sanitizeString, validateLength, isValidPrice, isValidImageUrl } from "@/lib/validation";
import { createValidationErrorResponse, handleError, createForbiddenResponse } from "@/lib/errors";

function generateProductId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `PROD-${timestamp}-${random}`;
}

export async function POST(req) {
  try {
    // Authentication check - must be seller
    const authResult = await requireRole('seller');
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;

    const { productName, description, price, category, idUrl, username } = await req.json();

    // Input validation
    if (!productName || !description || !price || !category || !idUrl || !username) {
      return createValidationErrorResponse("All fields are required");
    }

    // Sanitize inputs
    const sanitizedProductName = sanitizeString(productName, 200);
    const sanitizedDescription = sanitizeString(description, 1000);
    const sanitizedCategory = sanitizeString(category, 50);
    const sanitizedUsername = sanitizeString(username, 50);

    // Verify ownership - seller can only add products to their own account
    const ownershipCheck = await verifyOwnership(sanitizedUsername);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
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
    if (!isValidImageUrl(idUrl)) {
      return createValidationErrorResponse("Invalid image URL format");
    }

    const supabase = await createClient();

    const productId = generateProductId();

    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        product_id: productId,
        seller_username: sanitizedUsername,
        product_name: sanitizedProductName,
        description: sanitizedDescription,
        price: typeof price === 'number' ? price.toString() : price,
        category: sanitizedCategory,
        id_url: idUrl,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { message: "Product name already taken." },
          { status: 409 }
        );
      }

      return handleError(error, 'addProduct');
    }

    return NextResponse.json({ 
      message: "Product added successfully!", 
      productId: newProduct.product_id 
    }, { status: 201 });
  } catch (err) {
    return handleError(err, 'addProduct');
  }
}