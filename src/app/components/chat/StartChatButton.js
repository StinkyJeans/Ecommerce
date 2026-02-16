"use client";

import { useRouter } from "next/navigation";
import { ChatBubble } from "griddy-icons";

export default function StartChatButton({ sellerUsername, productId, className = "", children }) {
  const router = useRouter();

  const handleClick = () => {
    const params = new URLSearchParams();
    if (sellerUsername) params.set("seller", sellerUsername);
    if (productId) params.set("product", productId);
    router.push(`/chat?${params.toString()}`);
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
