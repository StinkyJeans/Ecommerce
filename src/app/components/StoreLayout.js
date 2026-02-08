"use client";

import { usePathname } from "next/navigation";
import UserSidebar from "./UserSidebar";

const STORE_PATHS = [
  "/",
  "/dashboard",
  "/cart/viewCart",
  "/search",
];

function isStoreRoute(pathname) {
  if (!pathname) return false;
  if (STORE_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/product/category")) return true;
  return false;
}

export default function StoreLayout({ children }) {
  const pathname = usePathname();
  const showSidebar = isStoreRoute(pathname);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1a1a]">
      <UserSidebar />
      <main className="flex-1 ml-64 overflow-auto">
        {children}
      </main>
    </div>
  );
}
