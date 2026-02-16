"use client";

import { Chat } from "griddy-icons";
import { useChatModal } from "@/app/context/ChatModalContext";

export default function FloatingChatButton({ unreadCount = 0 }) {
  const { openChat } = useChatModal();

  return (
    <button
      type="button"
      onClick={() => openChat()}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#2F79F4] hover:bg-[#2563eb] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#2F79F4] focus:ring-offset-2 dark:focus:ring-offset-[#1a1a1a]"
      aria-label={unreadCount > 0 ? `${unreadCount} unread messages` : "Open messages"}
    >
      <Chat size={24} className="text-white" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
