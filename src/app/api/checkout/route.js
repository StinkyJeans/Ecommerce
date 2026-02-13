import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { parseAndVerifyBody } from "@/lib/signing";
import { sanitizeString, isValidQuantity, isValidPrice } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";
import { randomUUID } from "crypto";

export async function POST(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;
    const { body, verifyError } = await parseAndVerifyBody(req, userData.id);
    if (verifyError) return verifyError;
    const username = sanitizeString(body.username, 50);
    const items = body.items;
    const shipping_address_id = body.shipping_address_id ? sanitizeString(String(body.shipping_address_id), 100) : null;
    const payment_method = body.payment_method ? sanitizeString(body.payment_method, 50) : null;
    const delivery_option = body.delivery_option ? sanitizeString(body.delivery_option, 50) : null;
    
    if (!username || !items || !Array.isArray(items) || items.length === 0) {
      return createValidationErrorResponse("Username and items are required");
    }
    
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    
    // Validate all items first
    for (const item of items) {
      if (!item.product_id || !item.product_name || item.price === null || item.price === undefined) {
        return createValidationErrorResponse("Invalid item data");
      }
      
      // Sanitize item fields
      const sanitizedProductId = sanitizeString(String(item.product_id), 100);
      const sanitizedProductName = sanitizeString(item.product_name, 200);
      const sanitizedIdUrl = item.id_url ? sanitizeString(item.id_url, 500) : null;
      
      if (!sanitizedProductId || !sanitizedProductName) {
        return createValidationErrorResponse("Invalid item data");
      }
      
      // Update item with sanitized values
      item.product_id = sanitizedProductId;
      item.product_name = sanitizedProductName;
      if (sanitizedIdUrl) item.id_url = sanitizedIdUrl;
      
      if (!isValidPrice(item.price)) {
        return createValidationErrorResponse("Invalid price in item");
      }
      if (!isValidQuantity(item.quantity)) {
        return createValidationErrorResponse("Invalid quantity in item");
      }
    }
    
    const supabase = await createClient();
    if (!supabase) {
      return handleError(new Error("Supabase client not initialized"), 'checkout');
    }
    
    // Generate order group ID for this checkout session
    const orderGroupId = randomUUID();
    
    // Validate products, prices, and stock before creating orders
    const validatedItems = [];
    const errors = [];
    
    for (const item of items) {
      // 1. Check if product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, product_id, price, stock_quantity, is_available, seller_username')
        .eq('product_id', item.product_id)
        .single();
      
      if (productError || !product) {
        errors.push(`Product "${item.product_name}" is no longer available`);
        continue;
      }
      
      // 2. Verify current price matches cart price (or use current price)
      const currentPrice = parseFloat(product.price);
      const cartPrice = parseFloat(item.price);
      const finalPrice = currentPrice; // Use current price from database
      
      if (Math.abs(currentPrice - cartPrice) > 0.01) {
        // Price changed - use current price but could also return error
        // For now, we'll use current price and continue
      }
      
      // 3. Check stock availability
      const requestedQuantity = item.quantity || 1;
      const availableStock = product.stock_quantity || 0;
      
      if (!product.is_available) {
        errors.push(`Product "${item.product_name}" is currently unavailable`);
        continue;
      }
      
      if (availableStock < requestedQuantity) {
        errors.push(`Insufficient stock for "${item.product_name}". Available: ${availableStock}, Requested: ${requestedQuantity}`);
        continue;
      }
      
      validatedItems.push({
        ...item,
        product,
        finalPrice,
        originalPrice: cartPrice
      });
    }
    
    // If there are validation errors, return them
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Some items are no longer available",
        errors: errors
      }, { status: 400 });
    }
    
    // Create orders and update stock
    const orders = [];
    const cartItemIds = [];
    
    for (const item of validatedItems) {
      const quantity = item.quantity || 1;
      const totalAmount = item.finalPrice * quantity;
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          username: username,
          seller_username: item.product.seller_username || item.seller_username || 'Unknown',
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.finalPrice,
          original_price: item.originalPrice,
          quantity: quantity,
          total_amount: totalAmount,
          status: 'pending',
          id_url: item.id_url || null,
          shipping_address_id: shipping_address_id,
          order_group_id: orderGroupId
        })
        .select()
        .single();
      
      if (orderError) {
        return handleError(orderError, 'checkout');
      }
      
      orders.push(order);
      cartItemIds.push(item.id);
      
      // Decrement stock
      const newStock = (item.product.stock_quantity || 0) - quantity;
      const { error: stockError } = await supabase
        .from('products')
        .update({
          stock_quantity: Math.max(0, newStock),
          is_available: newStock > 0
        })
        .eq('product_id', item.product_id);
      
      if (stockError) {
        console.error('Failed to update stock:', stockError);
        // Don't fail the order, but log the error
      }
    }
    
    // Remove items from cart
    for (const cartItemId of cartItemIds) {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);
      if (deleteError) {
        console.error('Failed to remove cart item:', deleteError);
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Order created successfully",
      orders: orders,
      order_group_id: orderGroupId
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'checkout');
  }
}
