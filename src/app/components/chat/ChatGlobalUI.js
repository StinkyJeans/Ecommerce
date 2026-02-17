"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useChatNotifications } from "@/app/hooks/useChatNotifications";
import { useChatModal } from "@/app/context/ChatModalContext";
import ChatNotification from "./ChatNotification";
import FloatingChatButton from "./FloatingChatButton";
import ChatModal from "./ChatModal";

export default function ChatGlobalUI() {
  const { username, loading: authLoading } = useAuth();
  const { isOpen } = useChatModal();
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!authLoading && username) {
      const loadChat = () => setShouldLoad(true);

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        const id = requestIdleCallback(loadChat, { timeout: 2000 });
        return () => cancelIdleCallback(id);
      } else {
        const timer = setTimeout(loadChat, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [authLoading, username]);

  const { notification, dismissNotification, unreadTotal } = useChatNotifications(
    username, 
    shouldLoad && !!username
  );

  if (!username || !shouldLoad) {
    return username ? <FloatingChatButton unreadCount={0} /> : null;
  }

  return (
    <>
      {notification && (
        <ChatNotification notification={notification} onDismiss={dismissNotification} />
      )}
      {!isOpen && <FloatingChatButton unreadCount={unreadTotal} />}
      <ChatModal />
    </>
  );
}
