import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { verifyRequestSignature } from "@/lib/signing";
import { handleError } from "@/lib/errors";

const LIMIT = 20;

export async function GET(req) {
  try {
    const authResult = await requireRole("seller");
    if (authResult instanceof NextResponse) return authResult;
    const { userData } = authResult;

    const verify = await verifyRequestSignature(req, null, userData.id);
    if (!verify.valid) return verify.response;

    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ message: "Server error" }, { status: 500 });

    const base = supabase
      .from("orders")
      .eq("seller_username", userData.username)
      .is("seller_seen_at", null);

    const { count: totalCount, error: countError } = await base
      .select("*", { count: "exact", head: true });

    if (countError) return handleError(countError, "order-notifications");

    const { data: orders, error } = await supabase
      .from("orders")
      .select("id, product_name, quantity, total_amount, created_at, order_group_id")
      .eq("seller_username", userData.username)
      .is("seller_seen_at", null)
      .order("created_at", { ascending: false })
      .limit(LIMIT);

    if (error) return handleError(error, "order-notifications");

    const list = orders || [];
    return NextResponse.json({ count: totalCount ?? list.length, orders: list });
  } catch (err) {
    return handleError(err, "order-notifications");
  }
}
