"use client";

import { PortalSidebarProvider } from "../context/PortalSidebarContext";

export default function AccountLayout({ children }) {
  return <PortalSidebarProvider>{children}</PortalSidebarProvider>;
}
