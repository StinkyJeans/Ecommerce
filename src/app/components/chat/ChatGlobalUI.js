"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useChatNotifications } from "@/app/hooks/useChatNotifications";
import { useChatModal } from "@/app/context/ChatModalContext";
import ChatNotification from "./ChatNotification";
import FloatingChatButton from "./FloatingChatButton";
import ChatModal from "./ChatModal";

/**
 * Renders site-wide chat UI when user is authenticated: in-app notification toast
 * and floating chat button with unread count. Mount inside AuthProvider and ChatModalProvider.
 * Deferred loading to avoid blocking initial page render.
 */
export default function ChatGlobalUI() {
  const { username, loading: authLoading } = useAuth();
  const { isOpen } = useChatModal();
  const [shouldLoad, setShouldLoad] = useState(false);

  // Defer loading chat features until after initial page load
  useEffect(() => {
    if (!authLoading && username) {
      // Wait for page to be interactive before loading chat
      // Use requestIdleCallback if available, otherwise setTimeout
      const loadChat = () => setShouldLoad(true);
      
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        const id = requestIdleCallback(loadChat, { timeout: 2000 });
        return () => cancelIdleCallback(id);
      } else {
        const timer = setTimeout(loadChat, 1500); // 1.5 second delay
        return () => clearTimeout(timer);
      }
    }
  }, [authLoading, username]);

  // Only enable notifications after deferred load
  const { notification, dismissNotification, unreadTotal } = useChatNotifications(
    username, 
    shouldLoad && !!username
  );

  if (!username || !shouldLoad) {
    // Still render FloatingChatButton immediately for better UX
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
