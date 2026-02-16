"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Navbar from "../components/sellerNavbar";
import Header from "@/app/components/header";
import { Users } from "griddy-icons";

export default function SellerCustomersPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (role && role !== "seller" && role !== "admin") {
      router.push("/");
      return;
    }
  }, [role, authLoading, router]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] flex">
      <Navbar />
      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col">
        <div className="z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <Header />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Customers
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              View and manage your customers. Coming soon.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Users size={52} className="text-5xl text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Customer management will be available here.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
