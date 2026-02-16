"use client";

import { useState, useCallback } from "react";
import { Send } from "griddy-icons";

const MAX_LENGTH = 4000;

export default function ChatInput({ onSend, disabled = false, placeholder = "Type a message..." }) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const text = value.trim();
      if (!text || disabled) return;
      onSend?.(text);
      setValue("");
    },
    [value, disabled, onSend]
  );

  const atLimit = value.length >= MAX_LENGTH;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3 border-t border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#2C2C2C]">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_LENGTH))}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 rounded-xl border border-[#E0E0E0] dark:border-[#404040] bg-[#f5f5f5] dark:bg-[#404040] px-4 py-2.5 text-sm sm:text-base text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#999999] focus:outline-none focus:ring-2 focus:ring-[#2F79F4]"
        aria-label="Message"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim() || atLimit}
        className="rounded-xl bg-[#2F79F4] hover:bg-[#2563eb] text-white p-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Send"
      >
        <Send size={20} className="text-current" />
      </button>
    </form>
  );
}
