"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Package, Settings, Heart, Home, LocationPin, LogOut } from "griddy-icons";
import { useAuth } from "@/app/context/AuthContext";
import { usePortalSidebar } from "@/app/context/PortalSidebarContext";

export default function UserPortalSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { logout } = useAuth();
  const portalContext = usePortalSidebar();
  const isOpen = portalContext ? portalContext.portalSidebarOpen : true;
  const onClose = portalContext ? () => portalContext.setPortalSidebarOpen(false) : () => {};

  const menuItems = [
    { id: "home", label: "Home", icon: Home, path: "/dashboard" },
    { id: "addresses", label: "Addresses", icon: LocationPin, path: "/account", tab: "addresses" },
    { id: "orders", label: "Order History", icon: Package, path: "/account", tab: "orders" },
    { id: "settings", label: "Account Settings", icon: Settings, path: "/account/settings" },
    { id: "wishlist", label: "Wishlist", icon: Heart, path: "/dashboard" },
  ];

  const handleLogout = async () => {
    onClose();
    await logout();
    router.push("/");
  };

  const isActive = (item) => {
    if (item.path === "/account/settings") return pathname === "/account/settings";
    if (item.path === "/account" && item.tab) {
      if (pathname !== "/account") return false;
      const tab = searchParams.get("tab");
      if (item.tab === "orders") return tab === "orders";
      if (item.tab === "addresses") return tab === "addresses" || !tab;
    }
    return pathname === item.path;
  };

  const handleNav = (item) => {
    if (item.tab) router.push(`${item.path}?tab=${item.tab}`);
    else router.push(item.path);
    onClose();
  };

  return (
    <>
      {portalContext && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700 flex flex-col z-40 transition-transform duration-200 ease-out md:translate-x-0 ${portalContext ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}`}
      >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">User Portal</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your preferences</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                  active
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {Icon && <Icon size={18} className="text-base" />}
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium"
        >
          <LogOut size={16} className="text-sm" />
          Logout
        </button>
      </div>
    </aside>
    </>
  );
}
