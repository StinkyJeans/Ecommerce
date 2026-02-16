"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe to new messages for the given conversation IDs.
 * @param {string[]} conversationIds - List of conversation UUIDs to listen to
 * @param {function(object): void} onMessage - Callback when a new message is inserted (payload.new)
 * @param {boolean} enabled - Whether subscription is active
 */
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
      if (payload.eventType === "INSERT" && payload.new) {
        const convId = payload.new.conversation_id;
        if (convId && idSet.has(convId)) {
          callbackRef.current?.(payload.new);
        }
      }
    };

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        handler
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // no-op
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, ids.join(",")]);
}
