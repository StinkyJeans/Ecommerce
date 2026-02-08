import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole, verifyOwnership } from "@/lib/auth";
import { parseAndVerifyBody } from "@/lib/signing";
import { sanitizeString, validateLength, isValidPrice, isValidImageUrl } from "@/lib/validation";
import { createValidationErrorResponse, handleError, createForbiddenResponse } from "@/lib/errors";
import { CANONICAL_CATEGORIES, isAllowedCategory } from "@/lib/categories";
function generateProductId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `PROD-${timestamp}-${random}`;
}
export async function POST(req) {
  try {
    const authResult = await requireRole('seller');
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;
    const { body, verifyError } = await parseAndVerifyBody(req, userData.id);
    if (verifyError) return verifyError;
    const { productName, description, price, category, idUrl, username, stockQuantity, isAvailable } = body;
    const validationErrors = [];
    if (!productName || !productName.trim()) {
      validationErrors.push("Product name is required");
    }
    if (!description || !description.trim()) {
      validationErrors.push("Description is required");
    }
    if (!price || price === '') {
      validationErrors.push("Price is required");
    }
    if (!category || !category.trim()) {
      validationErrors.push("Category is required");
    }
    if (!idUrl || !idUrl.trim()) {
      validationErrors.push("Product image is required");
    }
    if (!username || !username.trim()) {
      validationErrors.push("Username is required");
    }
    if (validationErrors.length > 0) {
      return createValidationErrorResponse(validationErrors);
    }
    const sanitizedProductName = sanitizeString(productName, 200);
    const sanitizedDescription = sanitizeString(description, 1000);
    const sanitizedCategory = sanitizeString(category, 50);
    const sanitizedUsername = sanitizeString(username, 50);
    const ownershipCheck = await verifyOwnership(sanitizedUsername);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    if (!validateLength(sanitizedProductName, 2, 200)) {
      validationErrors.push("Product name must be between 2 and 200 characters");
    }
    if (!validateLength(sanitizedDescription, 10, 1000)) {
      validationErrors.push("Description must be between 10 and 1000 characters");
    }
    if (!isValidPrice(price)) {
      validationErrors.push("Invalid price format. Please enter a valid number");
    }
    if (!isValidImageUrl(idUrl)) {
      validationErrors.push("Invalid image URL format. Please upload a valid image");
    }
    if (!isAllowedCategory(sanitizedCategory)) {
      validationErrors.push(`Invalid category. Must be one of: ${CANONICAL_CATEGORIES.join(", ")}`);
    }
    
    // Validate stock quantity
    const stockQty = stockQuantity !== undefined && stockQuantity !== null 
      ? parseInt(stockQuantity, 10) 
      : 0;
    if (isNaN(stockQty) || stockQty < 0) {
      validationErrors.push("Stock quantity must be a non-negative integer");
    }
    
    const available = isAvailable !== undefined ? Boolean(isAvailable) : (stockQty > 0);
    
    if (validationErrors.length > 0) {
      return createValidationErrorResponse(validationErrors);
    }
    const supabase = await createClient();
    const productId = generateProductId();
    
    // Convert price to numeric
    const numericPrice = typeof price === 'number' ? price : parseFloat(price);
    
    const { data: newProduct, error } = await supabase
      .from('products')
      .insert({
        product_id: productId,
        seller_username: sanitizedUsername,
        product_name: sanitizedProductName,
        description: sanitizedDescription,
        price: numericPrice,
        category: sanitizedCategory,
        id_url: idUrl,
        stock_quantity: stockQty,
        is_available: available
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