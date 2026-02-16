"use client";

import { Store } from "griddy-icons";

function formatPreview(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ChatList({
  conversations,
  currentRole,
  selectedId,
  onSelect,
  loading,
}) {
  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-[#E0E0E0] dark:bg-[#404040] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!conversations?.length) {
    return (
      <div className="p-6 text-center text-[#666666] dark:text-[#a3a3a3] text-sm">
        No conversations yet. Start a chat from a product page or with a seller.
      </div>
    );
  }

  const list = conversations.map((c) => {
    const otherName = currentRole === "user" ? c.seller_username : c.user_username;
    const unread = currentRole === "user" ? c.user_unread_count : c.seller_unread_count;
    const isSelected = c.id === selectedId;

    return (
      <button
        key={c.id}
        type="button"
        onClick={() => onSelect(c)}
        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors ${
          isSelected
            ? "bg-[#2F79F4]/20 dark:bg-[#2F79F4]/30 border border-[#2F79F4]/50"
            : "hover:bg-[#f0f0f0] dark:hover:bg-[#404040] border border-transparent"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-[#E0E0E0] dark:bg-[#404040] flex items-center justify-center flex-shrink-0">
          <Store size={20} className="text-[#666666] dark:text-[#a3a3a3]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] truncate">
            {otherName}
          </p>
          <p className="text-xs text-[#666666] dark:text-[#a3a3a3]">
            {formatPreview(c.last_message_at)}
          </p>
        </div>
        {unread > 0 && (
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#2F79F4] text-white text-xs font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    );
  });

  return <div className="p-2 space-y-1 overflow-y-auto">{list}</div>;
}
