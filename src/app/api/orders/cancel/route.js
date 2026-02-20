import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { parseAndVerifyBody } from "@/lib/signing";
import { sanitizeString } from "@/lib/validation";
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
    
    const orderId = sanitizeString(body.order_id, 100);
    const cancellationReason = body.cancellation_reason ? sanitizeString(body.cancellation_reason, 500) : null;
    const username = sanitizeString(body.username || userData.username, 50);
    
    if (!orderId) {
      return createValidationErrorResponse("Order ID is required to cancel an order");
    }
    
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    
    const supabase = await createClient();
    
    // Fetch the order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('username', username)
      .single();
    
    if (fetchError || !order) {
      return NextResponse.json({
        success: false,
        message: "Order not found. Please check the order ID and try again."
      }, { status: 404 });
    }
    
    // Only allow cancellation of pending orders
    if (order.status !== 'pending') {
      return NextResponse.json({
        success: false,
        message: `Cannot cancel this order. Only pending orders can be cancelled. This order is currently ${order.status}.`
      }, { status: 400 });
    }
    
    // Update order to cancelled
    const { data: cancelledOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellationReason || 'Cancelled by user',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json({
        success: false,
        message: "Failed to cancel order. Please try again."
      }, { status: 500 });
    }
    
    // Restore stock - fetch current stock first, then update
    const { data: product, error: productFetchError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('product_id', order.product_id)
      .single();
    
    if (!productFetchError && product) {
      const newStockQuantity = (parseInt(product.stock_quantity) || 0) + parseInt(order.quantity);
      const { error: stockError } = await supabase
        .from('products')
        .update({
          stock_quantity: newStockQuantity,
          is_available: newStockQuantity > 0
        })
        .eq('product_id', order.product_id);
      
      if (stockError) {
        console.error('Failed to restore stock:', stockError);
        // Don't fail the cancellation, but log the error
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Order cancelled successfully. The product stock has been restored.",
      order: cancelledOrder
    }, { status: 200 });
  } catch (err) {
    console.error('Error cancelling order:', err);
    return NextResponse.json({
      success: false,
      message: "An error occurred while cancelling the order. Please try again later."
    }, { status: 500 });
  }
}
