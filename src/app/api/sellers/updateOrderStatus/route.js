import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { parseAndVerifyBody } from "@/lib/signing";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";

const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export async function PATCH(req) {
  try {
    const authResult = await requireRole('seller');
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;
    
    const { body, verifyError } = await parseAndVerifyBody(req, userData.id);
    if (verifyError) return verifyError;
    
    const orderId = sanitizeString(body.order_id, 100);
    const newStatus = sanitizeString(body.status, 50);
    const trackingNumber = body.tracking_number ? sanitizeString(body.tracking_number, 200) : null;
    
    if (!orderId || !newStatus) {
      return createValidationErrorResponse("Order ID and status are required");
    }
    
    if (!VALID_STATUSES.includes(newStatus)) {
      return createValidationErrorResponse(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      );
    }
    
    const supabase = await createClient();
    
    // First, verify the order exists and belongs to this seller
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (fetchError || !order) {
      return NextResponse.json({
        success: false,
        message: "Order not found"
      }, { status: 404 });
    }
    
    // Verify seller owns this order
    if (order.seller_username !== userData.username && userData.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: "Forbidden: You can only update your own orders"
      }, { status: 403 });
    }
    
    // Prevent status changes that don't make sense
    if (order.status === 'cancelled' && newStatus !== 'cancelled') {
      return NextResponse.json({
        success: false,
        message: "Cannot change status of a cancelled order"
      }, { status: 400 });
    }
    
    if (order.status === 'delivered' && newStatus !== 'delivered') {
      return NextResponse.json({
        success: false,
        message: "Cannot change status of a delivered order"
      }, { status: 400 });
    }
    
    // Build update object
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };
    
    // Add tracking number if provided and status is shipped
    if (newStatus === 'shipped' && trackingNumber) {
      updateData.tracking_number = trackingNumber;
    }
    
    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();
    
    if (updateError) {
      return handleError(updateError, 'updateOrderStatus');
    }
    
    // If order is cancelled, restore stock
    if (newStatus === 'cancelled' && order.status !== 'cancelled') {
      // Fetch current stock first, then update
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
        }
      }
      
      // Set cancellation timestamp
      await supabase
        .from('orders')
        .update({
          cancelled_at: new Date().toISOString()
        })
        .eq('id', orderId);
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'updateOrderStatus');
  }
}
