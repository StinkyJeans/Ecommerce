import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { verifyRequestSignature } from "@/lib/signing";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError, createForbiddenResponse } from "@/lib/errors";
export async function PATCH(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;
    const verify = await verifyRequestSignature(req, null, userData.id);
    if (!verify.valid) return verify.response;
    const { searchParams } = new URL(req.url);
    const id = sanitizeString(searchParams.get("id"), 100);
    const action = sanitizeString(searchParams.get("action"), 20);
    const username = sanitizeString(searchParams.get("username"), 50);
    if (!id || !action || !username) {
      return createValidationErrorResponse("Missing required parameters");
    }
    if (action !== 'increase' && action !== 'decrease') {
      return createValidationErrorResponse("Invalid action. Must be 'increase' or 'decrease'");
    }
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    const supabase = await createClient();
    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', id)
      .eq('username', username)
      .single();
    if (fetchError || !cartItem) {
      return NextResponse.json({ 
        message: "Cart item not found",
        success: false 
      }, { status: 404 });
    }
    if (cartItem.username !== username) {
      return createForbiddenResponse("You do not have permission to modify this cart item");
    }
    if (action === 'increase') {
      // Check stock availability before increasing quantity
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity, is_available')
        .eq('product_id', cartItem.product_id)
        .single();

      if (productError || !product) {
        return NextResponse.json({
          message: "Product not found",
          success: false
        }, { status: 404 });
      }

      if (!product.is_available) {
        return NextResponse.json({
          message: "Product is currently unavailable",
          success: false
        }, { status: 400 });
      }

      // Parse stock quantity - 0 or null means out of stock
      const rawStock = product.stock_quantity;
      const availableStock = rawStock != null && rawStock !== "" 
        ? Number(rawStock) 
        : 0;

      // Check if stock is available
      if (availableStock <= 0) {
        return NextResponse.json({
          message: "Product is out of stock",
          success: false
        }, { status: 400 });
      }

      // Check if new quantity would exceed available stock
      const newQuantity = cartItem.quantity + 1;
      if (newQuantity > availableStock) {
        return NextResponse.json({
          message: `Insufficient stock. Available: ${availableStock}, Requested: ${newQuantity}`,
          success: false,
          available_stock: availableStock,
          requested: newQuantity
        }, { status: 400 });
      }

      const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', id)
        .select()
        .single();
      if (updateError) {
        throw updateError;
      }
      return NextResponse.json({
        message: "Quantity updated successfully",
        success: true,
        cartItem: updated
      });
    } else if (action === 'decrease') {
      if (cartItem.quantity > 1) {
        const { data: updated, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: cartItem.quantity - 1 })
          .eq('id', id)
          .select()
          .single();
        if (updateError) {
          throw updateError;
        }
        return NextResponse.json({
          message: "Quantity updated successfully",
          success: true,
          cartItem: updated
        });
      } else {
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', id);
        if (deleteError) {
          throw deleteError;
        }
        return NextResponse.json({
          message: "Item removed from cart",
          success: true,
          removed: true
        });
      }
    }
    return NextResponse.json({
      message: "Invalid action",
      success: false
    }, { status: 400 });
  } catch (err) {
    return handleError(err, 'updateCartQuantity');
  }
}