// src/app/components/header.js
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
    <div className={`pb-4 pt-2 transition-all duration-300 ease-in-out ${isScrolled ? 'h-0 overflow-hidden opacity-0 mb-0 pointer-events-none' : 'mb-6'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">
          Featured Products
        </h1>
        <div className="flex items-center gap-3 sm:gap-5">
          <div
            className="relative cursor-pointer group"
            onClick={() => router.push("/cart/viewCart")}
          >
            <FontAwesomeIcon
              icon={faShoppingCart}
              className="text-red-600 text-xl sm:text-2xl group-hover:text-red-700 transition"
            />
            {cartCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg animate-in zoom-in-50 duration-200">
                {cartCount > 99 ? "99+" : cartCount}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <FontAwesomeIcon
              icon={faUser}
              className="text-gray-600 text-sm"
            />
            <span className="font-semibold text-gray-700 text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
              {username || "Loading..."}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 sm:px-5 py-2 bg-red-600 rounded text-white hover:bg-red-700 transition cursor-pointer text-sm sm:text-base whitespace-nowrap flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="text-sm" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
