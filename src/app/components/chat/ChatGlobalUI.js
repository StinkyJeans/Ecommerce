"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useChatNotifications } from "@/app/hooks/useChatNotifications";
import { useChatModal } from "@/app/context/ChatModalContext";
import ChatNotification from "./ChatNotification";
import FloatingChatButton from "./FloatingChatButton";
import ChatModal from "./ChatModal";

/**
 * Renders site-wide chat UI when user is authenticated: in-app notification toast
 * and floating chat button with unread count. Mount inside AuthProvider and ChatModalProvider.
 */
export default function ChatGlobalUI() {
  const { username } = useAuth();
  const { isOpen } = useChatModal();
  const { notification, dismissNotification, unreadTotal } = useChatNotifications(username, !!username);

  if (!username) return null;

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
