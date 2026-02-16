"use client";

import { ChatBubble } from "griddy-icons";
import { useChatModal } from "@/app/context/ChatModalContext";

export default function StartChatButton({ sellerUsername, productId, className = "", children }) {
  const { openChat } = useChatModal();

  const handleClick = () => {
    openChat({
      seller: sellerUsername,
      product: productId,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className || "inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#E0E0E0] dark:bg-[#404040] hover:bg-[#d0d0d0] dark:hover:bg-[#505050] text-[#2C2C2C] dark:text-[#e5e5e5] text-sm font-medium transition-colors"}
      aria-label="Message seller"
    >
      {children ?? (
        <>
          <ChatBubble size={18} />
          Message Seller
        </>
      )}
    </button>
  );
}
