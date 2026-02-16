"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, ShoppingBag, ChevronDown, LogOut, LogIn, User, UserCircle } from "griddy-icons";
import { useAuth } from "@/app/context/AuthContext";
import { getShopCategories } from "@/lib/categories";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

export default function UserSidebar({ isOpen, onClose }) {
  const SHOP_CATEGORIES = getShopCategories();
  const router = useRouter();
  const pathname = usePathname();
  const { logout, username, loading } = useAuth();
  const [shopOpen, setShopOpen] = useState(false);
  const isMobile = useIsMobile();

  const menuItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "shop", label: "Shop All", icon: ShoppingBag, path: null, hasDropdown: true },
    { id: "about", label: "About Us", icon: User, path: "/about" },
  ];

  const portalItems = [
    { id: "user-account", label: "User Account", icon: UserCircle, path: "/account" },
  ];

  const isItemActive = (item) => {
    if (item.id === "home") return pathname === "/" || pathname === "/dashboard";
    if (item.id === "shop") return pathname?.startsWith("/product/category");
    if (item.id === "about") return pathname === "/about";
    if (item.path) return pathname === item.path || pathname?.startsWith(item.path + "/");
    return false;
  };

  useEffect(() => {
    if (pathname?.startsWith("/product/category")) {
      setShopOpen(true);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const showLogin = !loading && !username;

  const handleShopCategory = (path) => {
    router.push(path);
    onClose?.();
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
        style={{ 
          cursor: isOpen ? 'pointer' : 'default',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-[#2C2C2C] border-r border-[#E0E0E0] dark:border-[#404040] flex flex-col z-50 md:translate-x-0 md:shadow-none`}
        style={{
          transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          boxShadow: isMobile ? (isOpen ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none') : 'none',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
      <div className="p-6 border-b border-[#E0E0E0] dark:border-[#404040]">
        <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#FFBF00] rounded-lg flex items-center justify-center shadow">
            <span className="text-[#2C2C2C] font-bold text-lg">T</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#2C2C2C] dark:text-white">Totally Normal</h1>
            <p className="text-xs text-[#666666] dark:text-[#a3a3a3]">Store</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="mb-6">
          <p className="text-xs font-semibold text-[#666666] dark:text-[#a3a3a3] uppercase tracking-wider mb-3 px-3">NAVIGATION</p>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const active = isItemActive(item);
              if (item.hasDropdown) {
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => setShopOpen((o) => !o)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        active
                          ? "bg-[#FFBF00] text-white font-semibold"
                          : "text-[#666666] dark:text-[#a3a3a3] hover:text-[#2C2C2C] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#404040]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && <item.icon size={18} className="text-current" />}
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <ChevronDown size={14} className={`text-xs transition-transform ${shopOpen ? "rotate-180" : ""}`} />
                    </button>
                    {shopOpen && (
                      <div className="mt-1 ml-4 pl-4 border-l border-[#E0E0E0] dark:border-[#404040] space-y-0.5 py-1">
                        {SHOP_CATEGORIES.map((c) => {
                          const isCategoryActive = pathname === c.path || pathname?.startsWith(c.path + "/");
                          return (
                            <button
                              key={c.path}
                              type="button"
                              onClick={() => handleShopCategory(c.path)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                                isCategoryActive
                                  ? "bg-[#FFBF00] text-white font-semibold"
                                  : "text-[#666666] dark:text-[#a3a3a3] hover:text-[#2C2C2C] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#404040]"
                              }`}
                            >
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    router.push(item.path);
                    onClose?.();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? "bg-[#FFBF00] text-white font-semibold"
                      : "text-[#666666] dark:text-[#a3a3a3] hover:text-[#2C2C2C] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#404040]"
                  }`}
                >
                  {item.icon && <item.icon size={18} className="text-current" />}
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {!loading && username && (
          <div>
            <p className="text-xs font-semibold text-[#666666] dark:text-[#a3a3a3] uppercase tracking-wider mb-3 px-3">PORTALS</p>
            <div className="space-y-1">
              {portalItems.map((item) => {
                const active = isItemActive(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(item.path);
                      onClose?.();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? "bg-[#FFBF00] text-white font-semibold"
                        : "text-[#666666] dark:text-[#a3a3a3] hover:text-[#2C2C2C] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#404040]"
                    }`}
                  >
                    {item.icon && <item.icon size={18} className="text-current" />}
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-[#E0E0E0] dark:border-white/10">
        {showLogin ? (
          <button
            onClick={() => {
              router.push("/login");
              onClose?.();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium bg-[#FFBF00] hover:bg-[#e6ac00] text-white rounded-xl transition-colors"
          >
            <LogIn size={16} className="text-sm" />
            <span>Login</span>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {username ? username.charAt(0).toUpperCase() : (loading ? "…" : "U")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2C2C2C] dark:text-white truncate">
                  {loading ? "Loading..." : (username || "User")}
                </p>
                <p className="text-xs text-[#666666] dark:text-white/50">Customer</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#666666] dark:text-white/70 hover:text-[#2C2C2C] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut size={16} className="text-sm" />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </aside>
    </>
  );
}
