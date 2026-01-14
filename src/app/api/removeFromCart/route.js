import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError, createForbiddenResponse } from "@/lib/errors";

export async function DELETE(req) {
  try {
    // Authentication check
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(req.url);
    const id = sanitizeString(searchParams.get("id"), 100);
    const username = sanitizeString(searchParams.get("username"), 50);

    // Input validation
    if (!id || !username) {
      return createValidationErrorResponse("Missing id or username");
    }

    // Verify ownership
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }

    const supabase = await createClient();

    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, username')
      .eq('id', id)
      .single();

    if (fetchError || !cartItem) {
      return NextResponse.json({ 
        success: false,
        message: "Item not found" 
      }, { status: 404 });
    }

    if (cartItem.username !== username) {
      return createForbiddenResponse("You do not have permission to remove this cart item");
    }

    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return handleError(deleteError, 'removeFromCart');
    }

    return NextResponse.json({ 
      success: true,
      message: "Item removed successfully" 
    }, { status: 200 });

  } catch (error) {
    return handleError(error, 'removeFromCart');
  }
}