import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole, verifyOwnership } from "@/lib/auth";
import { verifyRequestSignature } from "@/lib/signing";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";

export async function GET(req) {
  try {
    const authResult = await requireRole('seller');
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;
    
    const verify = await verifyRequestSignature(req, null, userData.id);
    if (!verify.valid) return verify.response;
    
    const { searchParams } = new URL(req.url);
    const sellerUsername = sanitizeString(searchParams.get('seller_username') || userData.username, 50);
    const statusFilter = sanitizeString(searchParams.get('status'), 50);
    
    // Verify seller owns the orders they're requesting
    if (sellerUsername !== userData.username && userData.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: "Forbidden: You can only view your own orders"
      }, { status: 403 });
    }
    
    const supabase = await createClient();
    
    let query = supabase
      .from('orders')
      .select('*')
      .eq('seller_username', sellerUsername)
      .order('created_at', { ascending: false });
    
    // Apply status filter if provided
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    
    const { data: orders, error } = await query;
    
    if (error) {
      return handleError(error, 'getSellerOrders');
    }
    
    // Optimize: Batch fetch all missing product images in one query instead of N queries
    const ordersWithoutImages = (orders || []).filter(order => !order.id_url);
    const productIds = [...new Set(ordersWithoutImages.map(order => order.product_id))];
    
    let productImageMap = {};
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('product_id, id_url')
        .in('product_id', productIds);
      
      if (products) {
        productImageMap = products.reduce((acc, product) => {
          acc[product.product_id] = product.id_url;
          return acc;
        }, {});
      }
    }
    
    // Map images to orders efficiently
    const ordersWithImages = (orders || []).map(order => ({
      ...order,
      id_url: order.id_url || productImageMap[order.product_id] || null
    }));
    
    return NextResponse.json({ 
      success: true,
      orders: ordersWithImages || [],
      count: ordersWithImages?.length || 0 
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'getSellerOrders');
  }
}
