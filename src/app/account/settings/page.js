"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { usePortalSidebar } from "@/app/context/PortalSidebarContext";
import { userFunctions, shippingFunctions } from "@/lib/supabase/api";
import UserPortalSidebar from "@/app/components/UserPortalSidebar";
import ThemeToggle from "@/app/components/ThemeToggle";
import { User, Lock, Plus, Timer, Menu } from "griddy-icons";

function formatPasswordChangedAt(ts) {
  if (!ts) return "Never";
  const d = new Date(ts);
  const now = new Date();
  const months = Math.floor((now - d) / (30 * 24 * 60 * 60 * 1000));
  if (months < 1) return "Last changed recently";
  if (months === 1) return "Last changed 1 month ago";
  if (months < 12) return `Last changed ${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "Last changed 1 year ago" : `Last changed ${years} years ago`;
}

function AccountSettingsContent() {
  const router = useRouter();
  const { username, loading: authLoading } = useAuth();
  const { setPortalSidebarOpen } = usePortalSidebar();
  const [profile, setProfile] = useState({ fullName: "", email: "", phone: "", passwordChangedAt: null });
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [toast, setToast] = useState({ text: "", type: "" });

  useEffect(() => {
    if (!authLoading && !username) {
      router.push("/");
      return;
    }
  }, [username, authLoading, router]);

  useEffect(() => {
    if (!username) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [profileRes, addrRes] = await Promise.all([
          userFunctions.getProfile().catch(() => ({ fullName: "", email: "", phone: "", passwordChangedAt: null })),
          shippingFunctions.getAddresses(username).catch(() => ({ success: false, addresses: [] })),
        ]);
        if (mounted) {
          setProfile({
            fullName: profileRes.fullName ?? profileRes.display_name ?? username ?? "",
            email: profileRes.email ?? "",
            phone: profileRes.phone ?? "",
            passwordChangedAt: profileRes.passwordChangedAt ?? null,
          });
          setAddresses(addrRes.addresses ?? []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [username]);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3000);
  };

  const handleUpdateProfile = () => {
    setProfileLoading(true);
    setTimeout(() => {
      setProfileLoading(false);
      showToast("Profile update coming soon.");
    }, 400);
  };

  const getAddressTag = (addr, idx) => {
    if (addr.is_default) return "HOME";
    return idx === 1 ? "WORK" : "ADDRESS";
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1a1a]">
      <Suspense fallback={<div className="w-64 bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
        <UserPortalSidebar />
      </Suspense>

      <main className="flex-1 md:ml-64 overflow-auto">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setPortalSidebarOpen(true)}
                className="md:hidden p-2 -ml-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu size={20} className="text-lg" />
              </button>
              <div className="flex items-center gap-2 cursor-pointer truncate" onClick={() => router.push("/dashboard")}>
                <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">Totally Normal</span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full flex-shrink-0" />
                <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">Store</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8">
          <nav className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4 truncate">
            <button type="button" onClick={() => router.push("/")} className="hover:text-blue-600 dark:hover:text-blue-400">Home</button>
            <span className="mx-2">/</span>
            <button type="button" onClick={() => router.push("/account")} className="hover:text-blue-600 dark:hover:text-blue-400">User Portal</button>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-gray-100 font-semibold">Account Settings</span>
          </nav>

          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">Account Settings</h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Update your profile, security preferences, and addresses.</p>
          </div>

          {toast.text && (
            <div className={`mb-6 p-4 rounded-xl ${
              toast.type === "error" ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800" : "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
            }`}>
              {toast.text}
            </div>
          )}

          {authLoading || loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 border-4 border-t-transparent border-blue-500 dark:border-blue-400 rounded-full loading-spinner-animated" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Profile Information */}
              <section className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Profile Information</h2>
                  <User size={22} className="text-gray-400 dark:text-gray-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.fullName}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    readOnly
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={profileLoading}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
                  >
                    {profileLoading ? <Timer size={18} className="animate-spin" /> : "Update Profile"}
                  </button>
                </div>
              </section>

              {/* Security */}
              <section className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Security</h2>
                  <Lock size={22} className="text-gray-400 dark:text-gray-500" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Password</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatPasswordChangedAt(profile.passwordChangedAt)}</p>
                  </div>
                  <button
                    onClick={() => router.push("/auth/forgot-password")}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Change Password
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">Two-Factor Authentication</h3>
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-500 text-white">ENABLED</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account.</p>
                  </div>
                  <button
                    onClick={() => showToast("2FA management coming soon.")}
                    className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    Manage 2FA
                  </button>
                </div>
              </section>

              {/* Address Book */}
              <section className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Address Book</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {addresses.map((addr, idx) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50"
                    >
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mb-2 ${
                        addr.is_default ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}>
                        {getAddressTag(addr, idx)}
                      </span>
                      <p className="font-bold text-gray-900 dark:text-gray-100">{addr.full_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="text-sm text-gray-600 dark:text-gray-400">{addr.address_line2}</p>}
                      <p className="text-sm text-gray-600 dark:text-gray-400">{[addr.city, addr.province, addr.postal_code].filter(Boolean).join(", ")}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{addr.country}</p>
                    </div>
                  ))}
                  <button
                    onClick={() => router.push("/account?tab=addresses")}
                    className="min-h-[140px] p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Plus size={28} className="text-2xl" />
                    <span className="font-medium">Add New Address</span>
                  </button>
                </div>
              </section>
            </div>
          )}

          <footer className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700 text-center px-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Totally Normal Store</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} Totally Normal Store. All rights reserved.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#1a1a1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 border-4 border-t-transparent border-blue-500 rounded-full loading-spinner-animated" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <AccountSettingsContent />
    </Suspense>
  );
}
