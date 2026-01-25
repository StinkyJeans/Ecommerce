import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { parseAndVerifyBody } from "@/lib/signing";
import { sanitizeString, isValidQuantity, isValidPrice } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";
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
    const shipping_address_id = body.shipping_address_id;
    const payment_method = body.payment_method;
    const delivery_option = body.delivery_option;
    if (!username || !items || !Array.isArray(items) || items.length === 0) {
      return createValidationErrorResponse("Username and items are required");
    }
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    for (const item of items) {
      if (!item.product_id || !item.product_name || item.price === null || item.price === undefined) {
        return createValidationErrorResponse("Invalid item data");
      }
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
    const orders = [];
    const cartItemIds = [];
    for (const item of items) {
      const price = parseFloat(item.price || 0);
      const quantity = item.quantity || 1;
      const totalAmount = price * quantity;
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          username: username,
          seller_username: item.seller_username || 'Unknown',
          product_id: item.product_id,
          product_name: item.product_name,
          price: price,
          quantity: quantity,
          total_amount: totalAmount,
          status: 'pending',
          id_url: item.id_url || null
        })
        .select()
        .single();
      if (orderError) {
        return handleError(orderError, 'checkout');
      }
      orders.push(order);
      cartItemIds.push(item.id);
    }
    for (const cartItemId of cartItemIds) {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId);
      if (deleteError) {
      }
    }
    return NextResponse.json({ 
      success: true,
      message: "Order created successfully",
      orders: orders
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'checkout');
  }
}