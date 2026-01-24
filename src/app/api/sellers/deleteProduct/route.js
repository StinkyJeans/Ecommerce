import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole, verifySellerOwnership } from "@/lib/auth";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError, createForbiddenResponse } from "@/lib/errors";
export async function DELETE(req) {
  try {
    const authResult = await requireRole(['seller', 'admin']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;
    const { searchParams } = new URL(req.url);
    const id = sanitizeString(searchParams.get("id"), 100);
    const username = sanitizeString(searchParams.get("username"), 50);
    if (!id || !username) {
      return createValidationErrorResponse("Missing id or username");
    }
    const supabase = await createClient();
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, seller_username')
      .eq('id', id)
      .single();
    if (fetchError || !product) {
      return NextResponse.json({ 
        success: false,
        message: "Item not found" 
      }, { status: 404 });
    }
    if (userData.role === 'seller') {
      if (product.seller_username !== username) {
        return createForbiddenResponse("You can only delete your own products");
      }
      const ownershipCheck = await verifySellerOwnership(product.seller_username);
      if (ownershipCheck instanceof NextResponse) {
        return ownershipCheck;
      }
    }
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (deleteError) {
      return handleError(deleteError, 'deleteProduct');
    }
    return NextResponse.json({ 
      success: true,
      message: "Item removed successfully" 
    }, { status: 200 });
  } catch (error) {
    return handleError(error, 'deleteProduct');
  }
}