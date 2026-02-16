"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useChatModal } from "@/app/context/ChatModalContext";
import { chatFunctions } from "@/lib/supabase/api";
import { useChatRealtime } from "@/app/hooks/useChatRealtime";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import { Close, Chat as ChatIcon, ChevronLeft } from "griddy-icons";

export default function ChatModal() {
  const { isOpen, closeChat, initialSeller, initialProduct, initialConversation } = useChatModal();
  const { username, role, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileShowWindow, setMobileShowWindow] = useState(false);

  const currentRole = role === "seller" ? "seller" : "user";

  const fetchConversations = useCallback(async () => {
    if (!username) return;
    setLoadingConversations(true);
    try {
      const res = await chatFunctions.getConversations();
      setConversations(res.conversations || []);
      setUnreadTotal(res.unreadTotal ?? 0);
    } catch {
      setConversations([]);
      setUnreadTotal(0);
    } finally {
      setLoadingConversations(false);
    }
  }, [username]);

  useEffect(() => {
    if (!isOpen || authLoading) return;
    if (!username || (role !== "user" && role !== "seller")) {
      closeChat();
      return;
    }
    fetchConversations();
  }, [isOpen, authLoading, username, role, fetchConversations, closeChat]);

  useEffect(() => {
    if (!isOpen || !username || !conversations.length) return;

    if (initialConversation) {
      const conv = conversations.find((c) => c.id === initialConversation);
      if (conv) {
        setSelectedConversation(conv);
        setMobileShowWindow(true);
      }
    } else if (initialSeller && role === "user") {
      (async () => {
        try {
          const conv = await chatFunctions.getOrCreateConversation({
            seller_username: initialSeller,
            product_id: initialProduct || undefined,
          });
          if (conv) {
            await fetchConversations();
            const updated = conversations.find((c) => c.id === conv.id) || conv;
            setSelectedConversation(updated);
            setMobileShowWindow(true);
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [isOpen, username, role, initialSeller, initialProduct, initialConversation, conversations, fetchConversations]);

  const fetchMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) return;
      setLoadingMessages(true);
      try {
        const res = await chatFunctions.getMessages(conversationId);
        setMessages(res.messages || []);
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedConversation?.id) {
      fetchMessages(selectedConversation.id);
      setMobileShowWindow(true);
    } else {
      setMessages([]);
    }
  }, [selectedConversation?.id, fetchMessages]);

  useChatRealtime(
    useMemo(
      () => (selectedConversation?.id ? [selectedConversation.id] : []),
      [selectedConversation?.id]
    ),
    useCallback(
      (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      },
      []
    ),
    isOpen && !!selectedConversation?.id
  );

  const handleSend = useCallback(
    async (text) => {
      if (!selectedConversation?.id || !username) return;
      setSending(true);
      try {
        const msg = await chatFunctions.sendMessage(selectedConversation.id, text);
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        await fetchConversations();
      } finally {
        setSending(false);
      }
    },
    [selectedConversation?.id, username, fetchConversations]
  );

  const handleMarkRead = useCallback(async (conversationId) => {
    try {
      await chatFunctions.markAsRead(conversationId);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                user_unread_count: currentRole === "user" ? 0 : c.user_unread_count,
                seller_unread_count: currentRole === "seller" ? 0 : c.seller_unread_count,
              }
            : c
        )
      );
      setUnreadTotal((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  }, [currentRole]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in"
        onClick={closeChat}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed bottom-6 right-6 w-[90vw] max-w-[900px] h-[85vh] max-h-[700px] bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-2xl z-[101] flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040] flex-shrink-0">
          <div className="flex items-center gap-2">
            <ChatIcon size={20} className="text-[#2F79F4]" />
            <h2 className="text-base font-semibold text-[#2C2C2C] dark:text-[#e5e5e5]">Messages</h2>
          </div>
          <button
            onClick={closeChat}
            className="p-1.5 rounded-lg text-[#666666] dark:text-[#a3a3a3] hover:bg-[#f0f0f0] dark:hover:bg-[#404040] transition-colors"
            aria-label="Close chat"
          >
            <Close size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Conversation List */}
          <aside
            className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col bg-white dark:bg-[#2C2C2C] border-r border-[#E0E0E0] dark:border-[#404040] ${
              mobileShowWindow ? "hidden md:flex" : "flex"
            }`}
          >
            <ChatList
              conversations={conversations}
              currentRole={currentRole}
              selectedId={selectedConversation?.id}
              onSelect={(c) => {
                setSelectedConversation(c);
                setMobileShowWindow(true);
              }}
              loading={loadingConversations}
            />
          </aside>

          {/* Chat Window */}
          <main
            className={`flex-1 flex flex-col min-w-0 bg-[#f5f5f5] dark:bg-[#1a1a1a] ${
              mobileShowWindow ? "flex" : "hidden md:flex"
            }`}
          >
            {selectedConversation && (
              <button
                type="button"
                className="md:hidden flex items-center gap-2 px-3 py-2 text-sm text-[#2F79F4]"
                onClick={() => setMobileShowWindow(false)}
              >
                <ChevronLeft size={18} /> Back to list
              </button>
            )}
            <ChatWindow
              conversation={selectedConversation}
              messages={messages}
              currentUsername={username}
              currentRole={currentRole}
              onSend={handleSend}
              sending={sending}
              onMarkRead={handleMarkRead}
            />
            {loadingMessages && selectedConversation && messages.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[#2C2C2C]/80">
                <div className="w-8 h-8 border-2 border-[#2F79F4] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
