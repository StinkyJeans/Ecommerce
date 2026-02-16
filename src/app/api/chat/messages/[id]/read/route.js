import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { handleError } from "@/lib/errors";

export async function PUT(req, context) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { userData } = authResult;
    const username = userData.username;
    const role = userData.role;

    if (role !== "user" && role !== "seller") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const params = typeof context?.params?.then === "function" ? await context.params : context?.params || {};
    const conversationId = params?.id ?? null;
    if (!conversationId) {
      return NextResponse.json({ message: "conversation id required" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Server error" }, { status: 500 });
    }

    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("id, user_username, seller_username")
      .eq("id", conversationId)
      .single();

    if (convError || !conv) {
      return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
    }

    const isParticipant =
      (role === "user" && conv.user_username === username) ||
      (role === "seller" && conv.seller_username === username);
    if (!isParticipant) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { data: unread } = await supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .is("read_at", null)
      .neq("sender_username", username);

    if (!unread?.length) {
      const { data: conv2 } = await supabase
        .from("conversations")
        .select("user_unread_count, seller_unread_count")
        .eq("id", conversationId)
        .single();
      return NextResponse.json({ updated: 0, conversation: conv2 });
    }

    const { error: updateErr } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .is("read_at", null)
      .neq("sender_username", username);

    if (updateErr) {
      return handleError(updateErr, "chat/messages/read");
    }

    const column = role === "user" ? "user_unread_count" : "seller_unread_count";
    const { data: convRow } = await supabase
      .from("conversations")
      .select("user_unread_count, seller_unread_count")
      .eq("id", conversationId)
      .single();

    const current = convRow?.[column] ?? 0;
    const next = Math.max(0, current - unread.length);
    await supabase
      .from("conversations")
      .update({ [column]: next, updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    return NextResponse.json({
      updated: unread.length,
      conversation: { ...convRow, [column]: next },
    });
  } catch (err) {
    return handleError(err, "chat/messages/read");
  }
}
