"use client";

import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ProductInfoCard from "./ProductInfoCard";
import { Store } from "griddy-icons";

export default function ChatWindow({
  conversation,
  messages,
  currentUsername,
  currentRole,
  onSend,
  sending,
  onMarkRead,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  useEffect(() => {
    if (conversation?.id && onMarkRead) {
      onMarkRead(conversation.id);
    }
  }, [conversation?.id, onMarkRead]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#666666] dark:text-[#a3a3a3] p-6">
        <Store size={48} className="mb-4 opacity-50" />
        <p className="text-center font-medium">Select a conversation or start a new chat</p>
      </div>
    );
  }

  const otherName = currentRole === "user" ? conversation.seller_username : conversation.user_username;
  const unreadCount =
    currentRole === "user" ? conversation.user_unread_count : conversation.seller_unread_count;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-2 p-3 border-b border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#2C2C2C]">
        <Store size={20} className="text-[#2F79F4]" />
        <span className="font-semibold text-[#2C2C2C] dark:text-[#e5e5e5]">{otherName}</span>
        {unreadCount > 0 && (
          <span className="ml-2 px-2 py-0.5 rounded-full bg-[#2F79F4] text-white text-xs font-medium">
            {unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {conversation.product_id && (
          <ProductInfoCard productId={conversation.product_id} />
        )}
        <div className="p-4 space-y-1">
          {(messages || []).map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwn={msg.sender_username === currentUsername}
              otherName={msg.sender_username === currentUsername ? null : otherName}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput onSend={onSend} disabled={sending} />
    </div>
  );
}
