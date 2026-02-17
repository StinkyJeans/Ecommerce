"use client";

import { createContext, useContext, useState, useCallback } from "react";

const ChatModalContext = createContext();

export function ChatModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialSeller, setInitialSeller] = useState(null);
  const [initialProduct, setInitialProduct] = useState(null);
  const [initialConversation, setInitialConversation] = useState(null);

  const openChat = useCallback((options = {}) => {
    setInitialSeller(options.seller || null);
    setInitialProduct(options.product || null);
    setInitialConversation(options.conversation || null);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setInitialSeller(null);
      setInitialProduct(null);
      setInitialConversation(null);
    }, 300);
  }, []);

  return (
    <ChatModalContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        initialSeller,
        initialProduct,
        initialConversation,
      }}
    >
      {children}
    </ChatModalContext.Provider>
  );
}

export function useChatModal() {
  const context = useContext(ChatModalContext);
  if (!context) {
    throw new Error("useChatModal must be used within ChatModalProvider");
  }
  return context;
}
