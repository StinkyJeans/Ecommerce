"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Navbar from "../components/sellerNavbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload,
  faLock,
  faMapMarkerAlt,
  faImage,
} from "@fortawesome/free-solid-svg-icons";

const initialForm = {
  storeName: "Totally Normal Store",
  supportEmail: "support@totallynormal.com",
  storeDescription: "The most normal store on the internet for all your regular needs.",
  bankName: "First National Bank",
  payoutFrequency: "Weekly",
  routingNumber: "*********",
  accountNumber: "***********1234",
  legalStreet: "123 Normal Way",
  city: "San Francisco",
  stateZip: "CA 94103",
  useBusinessAddressForReturns: true,
  warehouseReturnAddress: "",
};

const inputBase =
  "w-full px-4 py-2.5 rounded-xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#2C2C2C] text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#999999] focus:ring-2 focus:ring-[#2F79F4] focus:border-transparent outline-none disabled:opacity-60 disabled:bg-[#F5F5F5] dark:disabled:bg-[#404040]/50 disabled:cursor-not-allowed";

export default function SellerSettingsPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [savedForm, setSavedForm] = useState(initialForm);
  const [toast, setToast] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (role && role !== "seller" && role !== "admin") {
      router.push("/");
      return;
    }
  }, [role, authLoading, router]);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: "", type: "" }), 3000);
  };

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleDiscard = () => {
    setForm({ ...savedForm });
    showToast("Changes discarded", "success");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      setSavedForm({ ...form });
      showToast("Settings saved successfully");
    } catch (e) {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(form) !== JSON.stringify(savedForm);

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] flex">
      <Navbar />
      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col overflow-auto">
        <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5]">
                Business Settings
              </h1>
              <p className="text-[#666666] dark:text-[#a3a3a3] mt-1">
                Manage your store profile, payouts, and shipping details.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDiscard}
                disabled={!hasChanges}
                className="px-4 py-2.5 rounded-xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#2C2C2C] text-[#2C2C2C] dark:text-[#e5e5e5] font-medium hover:bg-[#F5F5F5] dark:hover:bg-[#404040] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="px-4 py-2.5 rounded-xl bg-[#2F79F4] hover:bg-[#2563eb] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>

          {toast.text && (
            <div
              className={`mb-6 p-4 rounded-xl ${
                toast.type === "error"
                  ? "bg-[#F44336]/10 text-[#F44336] border border-[#F44336]/30"
                  : "bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/30"
              }`}
            >
              {toast.text}
            </div>
          )}

          {/* Store Profile */}
          <section className="bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-sm border border-[#E0E0E0] dark:border-[#404040] p-6 mb-6">
            <h2 className="text-lg font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              Store Profile
            </h2>

            <div className="mb-6">
              <h3 className="font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-1">
                Store Identity
              </h3>
              <p className="text-sm text-[#666666] dark:text-[#a3a3a3] mb-4">
                Update your store logo and how customers see you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#2C2C2C] text-[#2C2C2C] dark:text-[#e5e5e5] font-medium hover:bg-[#F5F5F5] dark:hover:bg-[#404040] transition-colors"
                >
                  <FontAwesomeIcon icon={faUpload} className="text-sm" />
                  Upload New Logo
                </button>
                <div className="w-28 h-20 sm:w-32 sm:h-24 rounded-xl border-2 border-dashed border-[#E0E0E0] dark:border-[#404040] flex items-center justify-center bg-[#FAFAFA] dark:bg-[#404040]/30 flex-shrink-0">
                  <FontAwesomeIcon icon={faImage} className="text-2xl text-[#999999] dark:text-[#a3a3a3]" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Store Name</label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={(e) => update("storeName", e.target.value)}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Support Email</label>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => update("supportEmail", e.target.value)}
                  className={inputBase}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Public Store Description</label>
              <textarea
                value={form.storeDescription}
                onChange={(e) => update("storeDescription", e.target.value)}
                rows={3}
                className={`${inputBase} resize-none`}
              />
            </div>
          </section>

          {/* Payout Settings */}
          <section className="bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-sm border border-[#E0E0E0] dark:border-[#404040] p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-[#2C2C2C] dark:text-[#e5e5e5]">
                Payout Settings
              </h2>
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#4CAF50] text-white">
                VERIFIED
              </span>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#EFF6FF] dark:bg-[#2F79F4]/15 border border-[#BFDBFE] dark:border-[#2F79F4]/40 mb-6">
              <FontAwesomeIcon icon={faLock} className="text-[#2F79F4] mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-[#2F79F4]">Secure Banking</p>
                <p className="text-[#2F79F4]/90 dark:text-[#93C5FD] mt-1">
                  Your payout information is encrypted and securely managed by our payment processor.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Bank Name</label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) => update("bankName", e.target.value)}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Payout Frequency</label>
                <select
                  value={form.payoutFrequency}
                  onChange={(e) => update("payoutFrequency", e.target.value)}
                  className={inputBase}
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-weekly">Bi-weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Routing Number</label>
                <input
                  type="password"
                  value={form.routingNumber}
                  onChange={(e) => update("routingNumber", e.target.value)}
                  placeholder="*********"
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Account Number</label>
                <input
                  type="password"
                  value={form.accountNumber}
                  onChange={(e) => update("accountNumber", e.target.value)}
                  placeholder="***********1234"
                  className={inputBase}
                />
              </div>
            </div>
          </section>

          {/* Business Address */}
          <section className="bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-sm border border-[#E0E0E0] dark:border-[#404040] p-6 mb-6">
            <h2 className="text-lg font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              Business Address
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Legal Street Address</label>
                <input
                  type="text"
                  value={form.legalStreet}
                  onChange={(e) => update("legalStreet", e.target.value)}
                  className={inputBase}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">State / ZIP</label>
                  <input
                    type="text"
                    value={form.stateZip}
                    onChange={(e) => update("stateZip", e.target.value)}
                    className={inputBase}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Shipping Settings */}
          <section className="bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-sm border border-[#E0E0E0] dark:border-[#404040] p-6 mb-6">
            <h2 className="text-lg font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-4">
              Shipping Settings
            </h2>

            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={form.useBusinessAddressForReturns}
                onChange={(e) => update("useBusinessAddressForReturns", e.target.checked)}
                className="w-5 h-5 rounded border-[#E0E0E0] dark:border-[#404040] text-[#2F79F4] focus:ring-[#2F79F4] accent-[#2F79F4]"
              />
              <span className="font-medium text-[#2C2C2C] dark:text-[#e5e5e5]">
                Use business address for returns
              </span>
            </label>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">
                Warehouse / Return Address
              </label>
              <input
                type="text"
                value={form.warehouseReturnAddress}
                onChange={(e) => update("warehouseReturnAddress", e.target.value)}
                placeholder="Separate return address"
                disabled={form.useBusinessAddressForReturns}
                className={inputBase}
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#2C2C2C] text-[#2C2C2C] dark:text-[#e5e5e5] font-medium hover:bg-[#F5F5F5] dark:hover:bg-[#404040] transition-colors"
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-sm" />
              Map view of shipping origin
            </button>
          </section>

          {/* Bottom actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={handleDiscard}
              disabled={!hasChanges}
              className="px-5 py-2.5 rounded-xl border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-[#2C2C2C] text-[#2C2C2C] dark:text-[#e5e5e5] font-medium hover:bg-[#F5F5F5] dark:hover:bg-[#404040] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="px-5 py-2.5 rounded-xl bg-[#2F79F4] hover:bg-[#2563eb] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save and Finish
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
