"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function useChatRealtime(conversationIds, onMessage, enabled = true) {
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;
  const ids = Array.isArray(conversationIds) ? conversationIds.filter(Boolean) : [];

  useEffect(() => {
    if (!enabled || ids.length === 0) return;

    const supabase = createClient();
    if (!supabase) return;

    const channelName = `chat-messages-${ids.join("-").slice(0, 64)}`;
    const idSet = new Set(ids);
    const channel = supabase.channel(channelName);

    const handler = (payload) => {
      const ev = payload.eventType ?? payload.event_type ?? "";
      const isInsert = String(ev).toUpperCase() === "INSERT";
      const newRow = payload.new ?? payload.payload?.new;
      if (!isInsert || !newRow) return;
      const convId = newRow.conversation_id;
      if (convId && idSet.has(convId)) {
        callbackRef.current?.(newRow);
      }
    };

    const subConfig = {
      event: "INSERT",
      schema: "public",
      table: "messages",
    };
    if (ids.length === 1) {
      subConfig.filter = `conversation_id=eq.${ids[0]}`;
    }

    channel
      .on("postgres_changes", subConfig, handler)
      .subscribe(() => {});

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, ids.join(",")]);
}
