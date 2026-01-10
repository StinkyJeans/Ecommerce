"use client";

import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart, faUser, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const { logout, username } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    logout();
    router.replace("/");
  };

  return (
    <div className={`pb-3 sm:pb-4 pt-2 transition-all duration-300 ease-in-out ${isScrolled ? 'h-0 overflow-hidden opacity-0 mb-0 pointer-events-none' : 'mb-4 sm:mb-6'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
          Featured Products
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

          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-lg sm:rounded-xl md:rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation flex-1 sm:flex-initial">
            <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
              <FontAwesomeIcon
                icon={faUser}
                className="text-white text-[10px] sm:text-xs md:text-sm"
              />
            </div>
            <span className="font-semibold text-gray-700 text-[11px] sm:text-xs md:text-sm lg:text-base truncate max-w-[90px] sm:max-w-[100px] md:max-w-[120px] lg:max-w-none">
              {username || "Loading..."}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-2.5 sm:px-3 md:px-4 lg:px-5 py-1.5 sm:py-2 md:py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg sm:rounded-xl md:rounded-2xl text-white transition-all duration-200 cursor-pointer text-[11px] sm:text-xs md:text-sm lg:text-base whitespace-nowrap flex items-center gap-1 sm:gap-1.5 md:gap-2 touch-manipulation shadow-md hover:shadow-lg active:scale-95"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="text-[10px] sm:text-xs md:text-sm" />
            <span className="hidden xs:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
