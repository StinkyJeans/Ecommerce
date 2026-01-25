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
    const username = sanitizeString(searchParams.get('username'), 50);
    if (!username) {
      return createValidationErrorResponse("Username is required");
    }
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    const supabase = await createClient();
    const { data: cart, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false });
    if (error) {
      return handleError(error, 'getCart');
    }
    const cartWithSellers = await Promise.all(
      (cart || []).map(async (item) => {
        const { data: product } = await supabase
          .from('products')
          .select('seller_username')
          .eq('product_id', item.product_id)
          .single();
        return {
          ...item,
          idUrl: item.id_url,
          productName: item.product_name,
          seller_username: product?.seller_username || 'Unknown',
        };
      })
    );
    return NextResponse.json({ 
      cart: cartWithSellers,
      count: cartWithSellers.length 
    }, { status: 200 });
  } catch (err) {
    return handleError(err, 'getCart');
  }
}