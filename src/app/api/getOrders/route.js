import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";

export async function GET(req) {
  try {
    // Authentication check
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(req.url);
    const username = sanitizeString(searchParams.get('username'), 50);

    // Input validation
    if (!username) {
      return createValidationErrorResponse("Username is required");
    }

    // Verify ownership - user can only access their own orders
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

    const ordersWithImages = await Promise.all(
      (orders || []).map(async (order) => {
        if (order.id_url) {
          return order;
        }
        
        try {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('id_url')
            .eq('product_id', order.product_id)
            .single();

          if (productError) {
            // Error fetching product image - continue without image
            return {
              ...order,
              id_url: null,
            };
          }

          return {
            ...order,
            id_url: product?.id_url || null,
          };
        } catch (err) {
          // Error processing order - continue without image
          return {
            ...order,
            id_url: null,
          };
        }
      })
    );

    return NextResponse.json({ 
      orders: ordersWithImages || [],
      count: ordersWithImages?.length || 0 
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'getOrders');
  }
}
