import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { handleError } from "@/lib/errors";

const PAGE_SIZE = 50;
const MAX_CONTENT_LENGTH = 4000;

export async function GET(req) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { userData } = authResult;
    const username = userData.username;
    const role = userData.role;

    if (role !== "user" && role !== "seller") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversation_id");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10)));

    if (!conversationId) {
      return NextResponse.json({ message: "conversation_id is required" }, { status: 400 });
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

    const from = (page - 1) * limit;
    const { data: messages, error } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_username, sender_role, content, read_at, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    if (error) {
      return handleError(error, "chat/messages");
    }

    const list = (messages || []).reverse();
    return NextResponse.json({ messages: list, page, limit });
  } catch (err) {
    return handleError(err, "chat/messages");
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
    const conversation_id = body.conversation_id || null;
    let content = typeof body.content === "string" ? body.content.trim() : "";

    if (!conversation_id) {
      return NextResponse.json({ message: "conversation_id is required" }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ message: "content is required" }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ message: "Message too long" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Server error" }, { status: 500 });
    }

    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("id, user_username, seller_username")
      .eq("id", conversation_id)
      .single();

    if (convError || !conv) {
      return NextResponse.json({ message: "Conversation not found" }, { status: 404 });
    }

    const isUserParticipant = conv.user_username === username;
    const isSellerParticipant = conv.seller_username === username;
    if (!isUserParticipant && !isSellerParticipant) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const sender_role = role;
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id,
        sender_username: username,
        sender_role,
        content,
      })
      .select("id, conversation_id, sender_username, sender_role, content, read_at, created_at")
      .single();

    if (error) {
      return handleError(error, "chat/messages");
    }

    return NextResponse.json({ message });
  } catch (err) {
    return handleError(err, "chat/messages");
  }
}
