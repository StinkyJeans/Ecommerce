"use client";

import { usePathname } from "next/navigation";
import UserSidebar from "./UserSidebar";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";

const STORE_PATHS = [
  "/",
  "/dashboard",
  "/cart/viewCart",
  "/search",
  "/about",
];

function isStoreRoute(pathname) {
  if (!pathname) return false;
  if (STORE_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/product/category")) return true;
  return false;
}

function StoreLayoutContent({ children }) {
  const pathname = usePathname();
  const showSidebar = isStoreRoute(pathname);
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1a1a]">
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 md:ml-64 overflow-auto">
        {children}
      </main>
    </div>
  );
}

export default function StoreLayout({ children }) {
  return (
    <SidebarProvider>
      <StoreLayoutContent>{children}</StoreLayoutContent>
    </SidebarProvider>
  );
}
