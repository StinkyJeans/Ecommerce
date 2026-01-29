"use client";

import { useRouter } from "next/navigation";

export function AuthFooterLogin() {
  const router = useRouter();
  return (
    <footer className="w-full px-4 py-8 text-center">
      <p className="text-sm text-[#666666] dark:text-[#a3a3a3] mb-2">
        Want to sell in our platform?{" "}
        <button type="button" onClick={() => router.push("/sellerRegister")} className="text-[#2F79F4] dark:text-[#60a5fa] font-medium hover:underline">
          Sign up as seller
        </button>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
        <button type="button" onClick={() => router.push("/#terms")} className="hover:text-blue-600 dark:hover:text-blue-400">Terms of Service</button>
        <span>and</span>
        <button type="button" onClick={() => router.push("/#privacy")} className="hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</button>
      </div>
      <p className="text-gray-500 dark:text-gray-500 text-sm">© {new Date().getFullYear()} Totally Normal Store. Built for Everyone.</p>
    </footer>
  );
}

export function AuthFooterRegister() {
  const router = useRouter();
  return (
    <footer className="w-full px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700">
      <p className="text-gray-500 dark:text-gray-500 text-sm">© {new Date().getFullYear()} Totally Normal Store. All rights reserved.</p>
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        <button type="button" onClick={() => router.push("/#help")} className="hover:text-blue-600 dark:hover:text-blue-400">Help Center</button>
        <button type="button" onClick={() => router.push("/#privacy")} className="hover:text-blue-600 dark:hover:text-blue-400">Privacy</button>
        <button type="button" onClick={() => router.push("/#terms")} className="hover:text-blue-600 dark:hover:text-blue-400">Terms</button>
      </div>
    </footer>
  );
}

export function AuthFooterSeller() {
  const router = useRouter();
  return (
    <footer className="w-full px-4 py-6 text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        By submitting your application, you agree to our{" "}
        <button type="button" onClick={() => router.push("/#terms")} className="text-amber-600 dark:text-amber-400 hover:underline font-medium">Merchant Agreement</button>
        {" "}and{" "}
        <button type="button" onClick={() => router.push("/#privacy")} className="text-amber-600 dark:text-amber-400 hover:underline font-medium">Privacy Policy</button>.
      </p>
    </footer>
  );
}
