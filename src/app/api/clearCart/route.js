import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { verifyRequestSignature } from "@/lib/signing";
import { handleError } from "@/lib/errors";

export async function DELETE(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { userData } = authResult;
    const verify = await verifyRequestSignature(req, null, userData.id);
    if (!verify.valid) return verify.response;

    if (!userData.username) {
      return NextResponse.json({ success: true, message: "Cart cleared" }, { status: 200 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("username", userData.username);

    if (error) {
      return handleError(error, "clearCart");
    }

    return NextResponse.json({ success: true, message: "Cart cleared" }, { status: 200 });
  } catch (err) {
    return handleError(err, "clearCart");
  }
}
