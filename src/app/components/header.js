"use client";

import { useRouter, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart, faUser, faSignOutAlt, faChevronDown, faUserCircle, faBox } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState, useRef } from "react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, username } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const pageTitle = pathname === "/account" ? "My Account" : "Featured Products";

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!username) {
        setCartCount(0);
        return;
      }

      try {
        const res = await fetch(`/api/getCartCount?username=${username}`);
        if (res.ok) {
          const data = await res.json();
          setCartCount(data.count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch cart count:", err);
      }
    };

    fetchCartCount();

    const interval = setInterval(fetchCartCount, 5000);

    const handleCartUpdate = () => fetchCartCount();
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("cartUpdated", handleCartUpdate);
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
    await fetch("/api/logout", { method: "POST" });
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
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          {pageTitle}
        </h1>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto cursor-pointer">
          <button
            onClick={() => router.push("/cart/viewCart")}
            className="cursor-pointer relative p-2 sm:p-2.5 md:p-3 bg-gradient-to-br from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation group"
          >
            <FontAwesomeIcon
              icon={faShoppingCart}
              className="text-red-600 text-base sm:text-lg md:text-xl lg:text-2xl group-hover:scale-110 transition-transform cursor-pointer"
            />
            {cartCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-600 text-white text-[10px] sm:text-xs font-bold rounded-full min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-5 flex items-center justify-center px-1 sm:px-1.5 shadow-lg ring-2 ring-white animate-in zoom-in-50 duration-200">
                {cartCount > 99 ? "99+" : cartCount}
              </div>
            )}
          </button>

          <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation w-full sm:w-auto ${
                showDropdown 
                  ? 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
              }`}
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-white text-[10px] sm:text-xs md:text-sm"
                />
              </div>
              <span className={`font-semibold text-[11px] sm:text-xs md:text-sm lg:text-base truncate max-w-[90px] sm:max-w-[100px] md:max-w-[120px] lg:max-w-none ${
                showDropdown ? 'text-red-600' : 'text-gray-700'
              }`}>
                {username ? `${username.toUpperCase()}'S ACCOUNT` : "Loading..."}
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`text-[10px] sm:text-xs transition-transform duration-200 ${showDropdown ? 'rotate-180 text-red-600' : 'text-gray-500'}`}
              />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => handleMenuClick(() => router.push("/account"))}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors group"
                >
                  <FontAwesomeIcon icon={faUserCircle} className="text-base text-gray-500 group-hover:text-red-600" />
                  <span className="font-medium text-sm">Manage My Account</span>
                </button>
                <button
                  onClick={() => handleMenuClick(() => router.push("/account?tab=orders"))}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors group"
                >
                  <FontAwesomeIcon icon={faBox} className="text-base text-gray-500 group-hover:text-red-600" />
                  <span className="font-medium text-sm">My Orders</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors group"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="text-base text-gray-500 group-hover:text-red-600" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
