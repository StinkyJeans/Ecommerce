"use client";

import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingBag } from "@fortawesome/free-solid-svg-icons";

export function AuthHeaderLogin() {
  const router = useRouter();
  return (
    <header className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040]">
      <button type="button" onClick={() => router.push("/")} className="flex items-center gap-2">
        <div className="w-9 h-9 bg-[#2F79F4] rounded-lg flex items-center justify-center shadow">
          <FontAwesomeIcon icon={faShoppingBag} className="text-white text-sm" />
        </div>
        <span className="text-lg font-bold text-[#2C2C2C] dark:text-white">Totally Normal Store</span>
      </button>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/help")}
          className="text-[#666666] dark:text-[#a3a3a3] hover:text-[#2C2C2C] dark:hover:text-white text-sm font-medium"
        >
          Help
        </button>
        <button
          type="button"
          onClick={() => router.push("/contact")}
          className="px-4 py-2 bg-[#2F79F4] hover:bg-[#2563eb] text-white text-sm font-medium rounded-lg shadow"
        >
          Contact Us
        </button>
      </div>
    </header>
  );
}

export function AuthHeaderRegister() {
  const router = useRouter();
  return (
    <header className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040]">
      <button type="button" onClick={() => router.push("/")} className="flex items-center gap-2">
        <div className="w-9 h-9 bg-[#2F79F4] rounded-lg flex items-center justify-center shadow">
          <FontAwesomeIcon icon={faShoppingBag} className="text-white text-sm" />
        </div>
        <span className="text-lg font-bold text-[#2C2C2C] dark:text-white">Totally Normal Store</span>
      </button>
      <nav className="flex items-center gap-6">
        <button type="button" onClick={() => router.push("/dashboard")} className="text-[#666666] dark:text-[#a3a3a3] hover:text-[#2C2C2C] dark:hover:text-white text-sm font-medium">Shop</button>
        <button type="button" onClick={() => router.push("/")} className="px-4 py-2 bg-[#2F79F4] hover:bg-[#2563eb] text-white text-sm font-medium rounded-lg shadow">Login</button>
      </nav>
    </header>
  );
}

export function AuthHeaderSeller() {
  const router = useRouter();
  return (
    <header className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040]">
      <button type="button" onClick={() => router.push("/")} className="flex items-center gap-2">
        <div className="w-9 h-9 bg-[#2F79F4] rounded-lg flex items-center justify-center shadow">
          <FontAwesomeIcon icon={faShoppingBag} className="text-white text-sm" />
        </div>
        <span className="text-lg font-bold text-[#2C2C2C] dark:text-white">Totally Normal Store</span>
      </button>
      <nav className="flex items-center gap-4 sm:gap-6">
        <button type="button" onClick={() => router.push("/dashboard")} className="text-[#666666] dark:text-[#a3a3a3] hover:text-[#2C2C2C] dark:hover:text-white text-sm font-medium">Shop</button>
        <button type="button" onClick={() => router.push("/")} className="px-4 py-2 bg-[#2F79F4] hover:bg-[#2563eb] text-white text-sm font-medium rounded-lg shadow">Login</button>
      </nav>
    </header>
  );
}
