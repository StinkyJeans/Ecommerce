"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
export default function AdminLoginPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  useLoadingFavicon(authLoading, "Admin");
  useEffect(() => {
    if (!authLoading) {
      if (role !== "admin") {
        router.push("/");
        return;
      } else {
        router.push("/admin/dashboard");
      }
    }
  }, [role, authLoading, router]);
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}