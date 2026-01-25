import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole, verifySellerOwnership } from "@/lib/auth";
import { verifyRequestSignature } from "@/lib/signing";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError } from "@/lib/errors";
export async function GET(request) {
  try {
    const authResult = await requireRole('seller');
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;
    const verify = await verifyRequestSignature(request, null, userData.id);
    if (!verify.valid) return verify.response;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const username = sanitizeString(searchParams.get('username'), 50);
    if (!username) {
      return createValidationErrorResponse("Username is required");
    }
    const ownershipCheck = await verifySellerOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_username', username)
      .order('created_at', { ascending: false });
    if (error) {
      return handleError(error, 'getSellerProducts');
    }
    const transformedProducts = (products || []).map(product => ({
      ...product,
      productId: product.product_id,
      productName: product.product_name,
      idUrl: product.id_url,
      sellerUsername: product.seller_username,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));
    return NextResponse.json({ success: true, products: transformedProducts, count: transformedProducts.length });
  } catch (err) {
    return handleError(err, 'getSellerProducts');
  }
}