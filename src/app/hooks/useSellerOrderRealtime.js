"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function useSellerOrderRealtime(sellerUsername, onNewOrder, enabled = true) {
  const callbackRef = useRef(onNewOrder);
  callbackRef.current = onNewOrder;

  useEffect(() => {
    if (!enabled || !sellerUsername) return;

    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase.channel(`seller-orders-${sellerUsername}`);

    const handler = (payload) => {
      const ev = payload.eventType ?? payload.event_type ?? "";
      const isInsert = String(ev).toUpperCase() === "INSERT";
      const newRow = payload.new ?? payload.payload?.new;
      if (!isInsert || !newRow) return;
      if (newRow.seller_username === sellerUsername) {
        callbackRef.current?.(newRow);
      }
    };

    channel
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "orders",
        filter: `seller_username=eq.${sellerUsername}`,
      }, handler)
      .subscribe(() => {});

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, sellerUsername]);
}
