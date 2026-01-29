import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { parseAndVerifyBody } from "@/lib/signing";
import { sanitizeString, validateLength, isValidPrice, isValidQuantity, isValidImageUrl } from "@/lib/validation";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { createErrorResponse, createValidationErrorResponse, handleError, createForbiddenResponse } from "@/lib/errors";
export async function POST(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;
    const { body, verifyError } = await parseAndVerifyBody(req, userData.id);
    if (verifyError) return verifyError;
    const rateLimitResult = checkRateLimit(req, 'addToCart', userData.username);
    if (rateLimitResult && !rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }
    const username = sanitizeString(body.username, 50);
    const product_id = sanitizeString(body.productId || body.product_id, 100);
    const product_name = sanitizeString(body.productName || body.product_name, 200);
    const description = sanitizeString(body.description, 1000);
    const price = body.price;
    const id_url = sanitizeString(body.idUrl || body.id_url, 500);
    const quantity = body.quantity || 1;
    if (!username || !product_id || !product_name || !description || price === null || price === undefined || !id_url) {
      return createValidationErrorResponse("All fields are required");
    }
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    if (!validateLength(product_id, 1, 100)) {
      return createValidationErrorResponse("Product ID must be between 1 and 100 characters");
    }
    if (!validateLength(product_name, 1, 200)) {
      return createValidationErrorResponse("Product name must be between 1 and 200 characters");
    }
    if (!validateLength(description, 1, 1000)) {
      return createValidationErrorResponse("Description must be between 1 and 1000 characters");
    }
    if (!isValidPrice(price)) {
      return createValidationErrorResponse("Invalid price format");
    }
    if (!isValidImageUrl(id_url)) {
      return createValidationErrorResponse("Invalid image URL format");
    }
    if (!isValidQuantity(quantity)) {
      return createValidationErrorResponse("Quantity must be a positive integer");
    }
    const supabase = await createClient();
    
    // Check product exists and stock availability
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock_quantity, is_available, price')
      .eq('product_id', product_id)
      .single();
    
    if (productError || !product) {
      return NextResponse.json({
        message: "Product not found or no longer available",
        success: false
      }, { status: 404 });
    }
    
    if (!product.is_available) {
      return NextResponse.json({
        message: "Product is currently unavailable",
        success: false
      }, { status: 400 });
    }
    
    const requestedQuantity = quantity || 1;
    const availableStock = product.stock_quantity || 0;
    
    // Check existing cart quantity
    const { data: existing, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('username', username)
      .eq('product_id', product_id)
      .single();
    
    const currentCartQuantity = existing && !fetchError ? existing.quantity : 0;
    const totalRequestedQuantity = currentCartQuantity + requestedQuantity;
    
    if (availableStock < totalRequestedQuantity) {
      return NextResponse.json({
        message: `Insufficient stock. Available: ${availableStock}, Requested: ${totalRequestedQuantity}`,
        success: false,
        available_stock: availableStock
      }, { status: 400 });
    }
    
    if (existing && !fetchError) {
      const newQuantity = existing.quantity + requestedQuantity;
      const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existing.id)
        .select()
        .single();
      if (updateError) {
        throw updateError;
      }
      return NextResponse.json({ 
        message: "Product quantity updated in cart!", 
        updated: true,
        quantity: updated.quantity
      }, { status: 200 });
    }
    // Use current product price from database
    const currentPrice = parseFloat(product.price) || parseFloat(price);
    const priceString = typeof currentPrice === 'number' ? currentPrice.toString() : currentPrice;
    const { data: cartItem, error: insertError } = await supabase
      .from('cart_items')
      .insert({
        username,
        product_id: product_id,
        product_name: product_name,
        description: description,
        price: priceString,
        id_url: id_url,
        quantity: quantity || 1
      })
      .select()
      .single();
    if (insertError) {
      if (insertError.message && insertError.message.includes('row-level security')) {
        return createForbiddenResponse("Permission denied");
      }
      if (insertError.code === '23505') {
        return NextResponse.json(
          { message: "Product already in cart." },
          { status: 409 }
        );
      }
      return createErrorResponse("Failed to add to cart", 500, insertError);
    }
    return NextResponse.json({ 
      message: "Product added to cart successfully!",
      cartItem: {
        productId: cartItem.product_id,
        productName: cartItem.product_name,
        quantity: cartItem.quantity
      }
    }, { status: 201 });
  } catch (err) {
    return handleError(err, 'addToCart');
  }
}