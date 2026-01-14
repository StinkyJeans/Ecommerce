import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError, createForbiddenResponse } from "@/lib/errors";

export async function PATCH(req) {
  try {
    // Authentication check
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(req.url);
    const id = sanitizeString(searchParams.get("id"), 100);
    const action = sanitizeString(searchParams.get("action"), 20);
    const username = sanitizeString(searchParams.get("username"), 50);

    // Input validation
    if (!id || !action || !username) {
      return createValidationErrorResponse("Missing required parameters");
    }

    if (action !== 'increase' && action !== 'decrease') {
      return createValidationErrorResponse("Invalid action. Must be 'increase' or 'decrease'");
    }

    // Verify ownership
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }

    const supabase = await createClient();

    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', id)
      .eq('username', username)
      .single();
    
    if (fetchError || !cartItem) {
      return NextResponse.json({ 
        message: "Cart item not found",
        success: false 
      }, { status: 404 });
    }

    // Double-check ownership
    if (cartItem.username !== username) {
      return createForbiddenResponse("You do not have permission to modify this cart item");
    }

    if (action === 'increase') {
      const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: cartItem.quantity + 1 })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        message: "Quantity updated successfully",
        success: true,
        cartItem: updated
      });
    } else if (action === 'decrease') {
      if (cartItem.quantity > 1) {
        const { data: updated, error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: cartItem.quantity - 1 })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return NextResponse.json({
          message: "Quantity updated successfully",
          success: true,
          cartItem: updated
        });
      } else {
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', id);

        if (deleteError) {
          throw deleteError;
        }

        return NextResponse.json({
          message: "Item removed from cart",
          success: true,
          removed: true
        });
      }
    }

    return NextResponse.json({
      message: "Invalid action",
      success: false
    }, { status: 400 });
  } catch (err) {
    return handleError(err, 'updateCartQuantity');
  }
}