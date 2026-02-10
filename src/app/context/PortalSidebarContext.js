"use client";

import { createContext, useContext, useState } from "react";

const PortalSidebarContext = createContext(null);

export function PortalSidebarProvider({ children }) {
  const [portalSidebarOpen, setPortalSidebarOpen] = useState(false);

  return (
    <PortalSidebarContext.Provider value={{ portalSidebarOpen, setPortalSidebarOpen }}>
      {children}
    </PortalSidebarContext.Provider>
  );
}

export function usePortalSidebar() {
  return useContext(PortalSidebarContext);
}
