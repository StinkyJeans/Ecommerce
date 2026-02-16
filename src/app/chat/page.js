"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { chatFunctions } from "@/lib/supabase/api";
import { useChatRealtime } from "@/app/hooks/useChatRealtime";
import ChatList from "@/app/components/chat/ChatList";
import ChatWindow from "@/app/components/chat/ChatWindow";
import ThemeToggle from "@/app/components/ThemeToggle";
import { ChevronLeft, Chat as ChatIcon } from "griddy-icons";
import Link from "next/link";

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username, role, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileShowWindow, setMobileShowWindow] = useState(false);

  const sellerParam = searchParams.get("seller");
  const productParam = searchParams.get("product");
  const conversationParam = searchParams.get("conversation");

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
    if (authLoading) return;
    if (!username || (role !== "user" && role !== "seller")) {
      router.replace("/");
      return;
    }
    fetchConversations();
  }, [authLoading, username, role, router, fetchConversations]);

  useEffect(() => {
    if (!username || !conversations.length) return;

    if (conversationParam) {
      const conv = conversations.find((c) => c.id === conversationParam);
      if (conv) setSelectedConversation(conv);
    } else if (sellerParam && role === "user") {
      (async () => {
        try {
          const conv = await chatFunctions.getOrCreateConversation({
            seller_username: sellerParam,
            product_id: productParam || undefined,
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
  }, [username, role, sellerParam, productParam, conversationParam, conversations]);

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
    !!selectedConversation?.id
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

  if (authLoading || (!username && !role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] dark:bg-[#0f172a]">
        <div className="w-10 h-10 border-4 border-[#2F79F4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0f172a] flex flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040]">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-2 rounded-lg text-[#666666] dark:text-[#a3a3a3] hover:bg-[#f0f0f0] dark:hover:bg-[#404040]"
            aria-label="Back"
          >
            <ChevronLeft size={24} />
          </Link>
          <div className="flex items-center gap-2">
            <ChatIcon size={24} className="text-[#2F79F4]" />
            <h1 className="text-lg font-bold text-[#2C2C2C] dark:text-[#e5e5e5]">Messages</h1>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex min-h-0">
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
  );
}
