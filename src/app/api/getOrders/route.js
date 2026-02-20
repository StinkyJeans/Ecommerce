import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { verifyRequestSignature } from "@/lib/signing";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";
export async function GET(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;
    const verify = await verifyRequestSignature(req, null, userData.id);
    if (!verify.valid) return verify.response;
    const { searchParams } = new URL(req.url);
    const username = sanitizeString(searchParams.get('username'), 50) || userData.username;
    if (!username) {
      return createValidationErrorResponse("Username is required");
    }
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    const supabase = await createClient();
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false });
    if (error) {
      return handleError(error, 'getOrders');
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
      orders: ordersWithImages || [],
      count: ordersWithImages?.length || 0 
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'getOrders');
  }
}