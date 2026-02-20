"use client";

import { useRouter, usePathname } from "next/navigation";
import { ShoppingBasket, User, LogOut, ChevronDown, UserCircle, Package, Settings } from "griddy-icons";
import { useAuth } from "../context/AuthContext";
import { cartFunctions, authFunctions } from "@/lib/supabase/api";
import { useEffect, useState, useRef } from "react";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, username, loading } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const pageTitle = pathname === "/account" ? "My Account" : pathname === "/checkout" ? "Checkout Item's" : "Featured Products";

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!username) {
        setCartCount(0);
        return;
      }

      if (document.hidden) {
        return;
      }

      try {
        const data = await cartFunctions.getCartCount();
        setCartCount(Number(data?.count) ?? 0);
      } catch {
        setCartCount(0);
      }
    };

    fetchCartCount();

    const interval = setInterval(fetchCartCount, 30000);

    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener("cartUpdated", handleCartUpdate);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCartCount();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("cartUpdated", handleCartUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [username]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY || document.documentElement.scrollTop;
          setIsScrolled(scrollPosition > 50);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    setShowDropdown(false);
    setCartCount(0);
    await authFunctions.logout();
    logout();
    router.replace("/");
  };

  const handleMenuClick = (action) => {
    setShowDropdown(false);
    if (action) {
      action();
    }
  };

  return (
    <div className={`pb-3 sm:pb-4 pt-2 transition-all duration-300 ease-in-out ${isScrolled ? 'h-0 overflow-hidden opacity-0 mb-0 pointer-events-none' : 'mb-4 sm:mb-6'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-[#2C2C2C] dark:text-[#e5e5e5]">
          {pageTitle}
        </h1>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto cursor-pointer">
          <ThemeToggle />
          <button
            onClick={() => router.push("/cart/viewCart")}
            className="cursor-pointer relative p-2 sm:p-2.5 md:p-3 bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#404040] hover:bg-gray-50 dark:hover:bg-[#404040] rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation group"
          >
            <ShoppingBasket size={24} className="text-[#2C2C2C] dark:text-[#e5e5e5] group-hover:scale-110 transition-transform cursor-pointer" />
            {cartCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-[#FFBF00] text-white text-[10px] sm:text-xs font-bold rounded-full min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-5 flex items-center justify-center px-1 sm:px-1.5 shadow ring-2 ring-white dark:ring-[#2C2C2C] animate-in zoom-in-50 duration-200">
                {cartCount > 99 ? "99+" : cartCount}
              </div>
            )}
          </button>

          <div className="relative flex-1 sm:flex-initial min-w-0" ref={dropdownRef}>
            {!username && !loading ? (
              <button
                onClick={() => router.push("/login")}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation w-full sm:w-auto min-w-0 border bg-[#FFBF00] hover:bg-[#e6ac00] border-[#FFBF00] text-white font-semibold"
              >
                <User size={16} className="text-current" />
                <span className="text-[11px] sm:text-xs md:text-sm lg:text-base truncate">Login</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation w-full sm:w-auto min-w-0 border ${
                    showDropdown ? "bg-amber-50 dark:bg-amber-900/20 border-[#FFBF00]" : "bg-white dark:bg-[#2C2C2C] border-[#E0E0E0] dark:border-[#404040] hover:bg-gray-50 dark:hover:bg-[#404040]"
                  }`}
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-[#FFBF00] rounded-lg sm:rounded-xl flex items-center justify-center shadow flex-shrink-0">
                    <User size={16} className="text-white" />
                  </div>
                  <span className={`font-semibold text-[11px] sm:text-xs md:text-sm lg:text-base truncate min-w-0 flex-1 text-[#2C2C2C] dark:text-[#e5e5e5]`}>
                    {loading ? "Loading..." : `${username.toUpperCase()}'S ACCOUNT`}
                  </span>
                  <ChevronDown size={14} className={`transition-transform duration-200 flex-shrink-0 text-[#666666] dark:text-[#a3a3a3] ${showDropdown ? "rotate-180" : ""}`} />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white dark:bg-[#2C2C2C] rounded-xl shadow-xl border border-[#E0E0E0] dark:border-[#404040] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-120px)] overflow-y-auto">
                    <button onClick={() => handleMenuClick(() => router.push("/account?tab=addresses"))} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-amber-50 dark:hover:bg-[#404040] transition-colors group">
                      <UserCircle size={18} className="text-[#666666] dark:text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                      <span className="font-medium text-sm">Manage My Account</span>
                    </button>
                    <button onClick={() => handleMenuClick(() => router.push("/account/settings"))} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-amber-50 dark:hover:bg-[#404040] transition-colors group">
                      <Settings size={18} className="text-[#666666] dark:text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                      <span className="font-medium text-sm">Account Settings</span>
                    </button>
                    <button onClick={() => handleMenuClick(() => router.push("/account?tab=orders"))} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-amber-50 dark:hover:bg-[#404040] transition-colors group">
                      <Package size={18} className="text-[#666666] dark:text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                      <span className="font-medium text-sm">My Orders</span>
                    </button>
                    <div className="border-t border-[#E0E0E0] dark:border-[#404040] my-1" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-[#F44336] transition-colors group">
                      <LogOut size={18} className="text-[#666666] dark:text-[#a3a3a3] group-hover:text-[#F44336]" />
                      <span className="font-medium text-sm">Logout</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
