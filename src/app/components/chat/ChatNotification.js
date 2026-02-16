"use client";

import { Close, ChatBubble } from "griddy-icons";
import { useChatModal } from "@/app/context/ChatModalContext";

export default function ChatNotification({ notification, onDismiss }) {
  const { openChat } = useChatModal();
  if (!notification) return null;

  const { senderName, preview, conversationId } = notification;
  const text = preview?.slice(0, 60) ?? "";
  const suffix = (preview?.length ?? 0) > 60 ? "…" : "";

  const handleClick = () => {
    onDismiss?.();
    openChat({
      conversation: conversationId,
    });
  };

  return (
    <div
      className="fixed bottom-20 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-2 fade-in bg-[#2C2C2C] dark:bg-[#1a1a1a] text-white rounded-xl shadow-2xl border border-[#404040] overflow-hidden"
      role="alert"
    >
      <button
        type="button"
        onClick={handleClick}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-[#2F79F4] flex items-center justify-center flex-shrink-0">
          <ChatBubble size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">New message from {senderName}</p>
          <p className="text-xs text-[#a3a3a3] mt-0.5 truncate">{text}{suffix}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}
        className="absolute top-2 right-2 p-1 rounded-lg text-[#a3a3a3] hover:text-white"
        aria-label="Dismiss"
      >
        <Close size={16} />
      </button>
    </div>
  );
}
