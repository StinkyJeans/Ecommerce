"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useChatRealtime } from "./useChatRealtime";
import { chatFunctions } from "@/lib/supabase/api";

export function useChatNotifications(currentUsername, enabled = true) {
  const [conversationIds, setConversationIds] = useState([]);
  const [notification, setNotification] = useState(null);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const permissionRequested = useRef(false);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const handleNewMessage = useCallback(
    (message) => {
      if (!message || !currentUsername) return;
      if (message.sender_username === currentUsername) return;

      const preview = typeof message.content === "string" ? message.content : "";
      setNotification({
        senderName: message.sender_username || "Someone",
        preview,
        conversationId: message.conversation_id,
      });
      setUnreadTotal((prev) => prev + 1);

      if (typeof window !== "undefined" && window.Notification?.permission === "granted") {
        try {
          const n = new window.Notification("New message", {
            body: `${message.sender_username}: ${preview.slice(0, 80)}${preview.length > 80 ? "…" : ""}`,
            tag: `chat-${message.conversation_id}-${Date.now()}`,
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
        } catch (_) {}
      }
    },
    [currentUsername]
  );

  useChatRealtime(conversationIds, handleNewMessage, enabled && conversationIds.length > 0);

  useEffect(() => {
    if (!enabled || !currentUsername) {
      setConversationIds([]);
      setUnreadTotal(0);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      (async () => {
        try {
          const data = await chatFunctions.getConversations();
          const list = data?.conversations ?? [];
          if (!cancelled) {
            setConversationIds(list.map((c) => c.id).filter(Boolean));
            setUnreadTotal(data?.unreadTotal ?? 0);
          }
        } catch (_) {
          if (!cancelled) {
            setConversationIds([]);
            setUnreadTotal(0);
          }
        }
      })();
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [enabled, currentUsername]);

  useEffect(() => {
    if (!enabled || !currentUsername || permissionRequested.current) return;
    permissionRequested.current = true;
    if (typeof window !== "undefined" && window.Notification?.requestPermission) {
      window.Notification.requestPermission().catch(() => {});
    }
  }, [enabled, currentUsername]);

  return { notification, dismissNotification, unreadTotal };
}
