import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { parseAndVerifyBody } from "@/lib/signing";
import { handleError } from "@/lib/errors";

export async function POST(req) {
  try {
    const authResult = await requireRole("seller");
    if (authResult instanceof NextResponse) return authResult;
    const { userData } = authResult;

    const { body, verifyError } = await parseAndVerifyBody(req, userData.id);
    if (verifyError) return verifyError;

    const orderIds = Array.isArray(body?.order_ids) ? body.order_ids.filter(Boolean) : null;

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ message: "Server error" }, { status: 500 });

    let query = supabase
      .from("orders")
      .update({ seller_seen_at: new Date().toISOString() })
      .eq("seller_username", userData.username)
      .is("seller_seen_at", null);

    if (orderIds && orderIds.length > 0) {
      query = query.in("id", orderIds);
    }

    const { error } = await query.select("id").limit(1);

    if (error) return handleError(error, "order-notifications/read");

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err, "order-notifications/read");
  }
}
