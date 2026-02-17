import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { handleError } from "@/lib/errors";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { userData } = authResult;
    const username = userData.username;
    const role = userData.role;

    if (role !== "user" && role !== "seller") {
      return NextResponse.json({ message: "Forbidden", conversations: [] }, { status: 403 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Server error" }, { status: 500 });
    }

    let query = supabase.from("conversations").select(`
      id,
      user_username,
      seller_username,
      product_id,
      last_message_at,
      user_unread_count,
      seller_unread_count,
      created_at,
      updated_at
    `);

    if (role === "user") {
      query = query.eq("user_username", username);
    } else {
      query = query.eq("seller_username", username);
    }

    const { data: conversations, error } = await query.order("last_message_at", {
      ascending: false,
      nullsFirst: false,
    });

    if (error) {
      return handleError(error, "chat/conversations");
    }

    const list = conversations || [];
    const unreadTotal =
      role === "user"
        ? list.reduce((sum, c) => sum + (c.user_unread_count || 0), 0)
        : list.reduce((sum, c) => sum + (c.seller_unread_count || 0), 0);

    return NextResponse.json({
      conversations: list,
      unreadTotal,
    });
  } catch (err) {
    return handleError(err, "chat/conversations");
  }
}

export async function POST(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { userData } = authResult;
    const username = userData.username;
    const role = userData.role;

    if (role !== "user" && role !== "seller") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const seller_username_input = body.seller_username?.trim?.() || null;
    const product_id = body.product_id?.trim?.() || null;

    if (!seller_username_input) {
      return NextResponse.json({ message: "seller_username is required" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Server error" }, { status: 500 });
    }

    if (role === "seller") {
      return NextResponse.json(
        { message: "Customers start conversations; use GET to list your conversations" },
        { status: 400 }
      );
    }

    const { data: sellerRow } = await supabase
      .from("users")
      .select("username")
      .eq("role", "seller")
      .ilike("username", seller_username_input)
      .maybeSingle();
    const seller_username = sellerRow?.username ?? seller_username_input;

    const user_username = username;

    let existingQuery = supabase
      .from("conversations")
      .select("id, user_username, seller_username, product_id, last_message_at, user_unread_count, seller_unread_count, created_at, updated_at")
      .eq("user_username", user_username)
      .eq("seller_username", seller_username);
    if (product_id) {
      existingQuery = existingQuery.eq("product_id", product_id);
    } else {
      existingQuery = existingQuery.is("product_id", null);
    }
    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      return NextResponse.json({ conversation: existing, created: false });
    }

    const { data: inserted, error } = await supabase
      .from("conversations")
      .insert({
        user_username,
        seller_username,
        product_id: product_id || null,
      })
      .select("id, user_username, seller_username, product_id, last_message_at, user_unread_count, seller_unread_count, created_at, updated_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        const { data: again } = await supabase
          .from("conversations")
          .select("id, user_username, seller_username, product_id, last_message_at, user_unread_count, seller_unread_count, created_at, updated_at")
          .eq("user_username", user_username)
          .eq("seller_username", seller_username)
          .is("product_id", product_id)
          .maybeSingle();
        if (again) {
          return NextResponse.json({ conversation: again, created: false });
        }
      }
      return handleError(error, "chat/conversations");
    }

    return NextResponse.json({ conversation: inserted, created: true });
  } catch (err) {
    return handleError(err, "chat/conversations");
  }
}
