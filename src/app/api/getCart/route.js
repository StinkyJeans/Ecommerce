import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, verifyOwnership } from "@/lib/auth";
import { verifyRequestSignature } from "@/lib/signing";
import { sanitizeString } from "@/lib/validation";
import { createValidationErrorResponse, handleError, createSuccessResponse } from "@/lib/errors";
import { getCart as getCartService } from "@/lib/services/cartService";

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
    let username = sanitizeString(searchParams.get("username"), 50);
    if (!username) username = userData.username;
    if (!username) {
      return createValidationErrorResponse("Username is required");
    }
    const ownershipCheck = await verifyOwnership(username);
    if (ownershipCheck instanceof NextResponse) {
      return ownershipCheck;
    }
    const supabase = await createClient();
    const { cart: cartWithSellers, error } = await getCartService(supabase, userData.username);
    if (error) {
      return handleError(error, "getCart");
    }
    return createSuccessResponse(
      { cart: cartWithSellers, count: cartWithSellers.length },
      200,
      { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" }
    );
  } catch (err) {
    return handleError(err, "getCart");
  }
}