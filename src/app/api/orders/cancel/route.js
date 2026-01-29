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
      return createValidationErrorResponse("Order ID is required");
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
        message: "Order not found"
      }, { status: 404 });
    }
    
    // Only allow cancellation of pending orders
    if (order.status !== 'pending') {
      return NextResponse.json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.`
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
      return handleError(updateError, 'cancelOrder');
    }
    
    // Restore stock
    const { error: stockError } = await supabase
      .from('products')
      .update({
        stock_quantity: supabase.raw(`stock_quantity + ${order.quantity}`),
        is_available: true
      })
      .eq('product_id', order.product_id);
    
    if (stockError) {
      console.error('Failed to restore stock:', stockError);
      // Don't fail the cancellation, but log the error
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Order cancelled successfully",
      order: cancelledOrder
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'cancelOrder');
  }
}
