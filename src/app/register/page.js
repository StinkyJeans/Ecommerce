"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { createClient } from "@/lib/supabase/client";
import { authFunctions } from "@/lib/supabase/api";
import { Eye, EyeOff, CheckCircle, Google } from "griddy-icons";
import { AuthHeaderRegister } from "@/app/components/auth/AuthHeader";
import { AuthFooterRegister } from "@/app/components/auth/AuthFooter";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupSuccess, setPopupSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useLoadingFavicon(loading || googleLoading, "Register");

  const handleGoogleSignUp = async () => {
    if (!supabase) return;
    setGoogleLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });
      if (error) {
        setPopupMessage(error.message?.includes("provider is not enabled")
          ? "Google sign up is not enabled. Please use the form below."
          : `Error: ${error.message}`);
        setPopupSuccess(false);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000);
      }
    } catch (err) {
      setPopupMessage("Something went wrong. Please try again.");
      setPopupSuccess(false);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 5000);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authFunctions.register({
        displayName,
        email,
        password,
        role: "user",
        contact: phone || undefined,
      });
      const ok = data?.message && data.success !== false && !data.error && !data.errors;
      if (ok) {
        setPopupMessage(data.message || "Account created successfully.");
        setPopupSuccess(true);
        setShowPopup(true);
        setTimeout(() => { setShowPopup(false); router.push("/"); }, 2000);
      } else {
        setPopupMessage(data?.error || data?.message || (Array.isArray(data?.errors) ? data.errors.join(". ") : "Registration failed."));
        setPopupSuccess(false);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 4000);
      }
    } catch (error) {
      let msg = "Registration failed. Please try again.";
      if (error.response?.errors && Array.isArray(error.response.errors)) msg = error.response.errors.join(". ");
      else if (error.response?.message) msg = error.response.message;
      else if (error.message) msg = error.message;
      setPopupMessage(msg);
      setPopupSuccess(false);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] flex flex-col">
      <AuthHeaderRegister />

      <div className="flex-1 flex items-center justify-center p-4">
        {showPopup && (
          <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-5 z-50 max-w-sm sm:max-w-md animate-fade-in ${
            popupSuccess ? "bg-[#4CAF50]" : "bg-[#F44336]"
          } text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-center gap-3`}>
            <CheckCircle size={20} className="flex-shrink-0 text-white" />
            <span className="font-medium text-sm sm:text-base break-words">{popupMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleRegister}
          className="relative w-full max-w-md bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-lg border border-[#E0E0E0] dark:border-[#404040] p-6 sm:p-8"
        >
          {loading && (
            <div className="absolute inset-0 bg-white/95 dark:bg-[#2C2C2C]/95 rounded-2xl flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-[#E0E0E0] dark:border-[#404040] border-t-[#2F79F4] rounded-full loading-spinner-animated" />
                <p className="text-[#2C2C2C] dark:text-[#e5e5e5] font-medium">Creating account...</p>
              </div>
            </div>
          )}

          <h1 className="text-xl sm:text-2xl font-bold text-[#2C2C2C] dark:text-white">Join Totally Normal Store</h1>
          <p className="text-[#666666] dark:text-[#a3a3a3] text-sm mt-1 mb-6">The one-stop shop for your everyday needs.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Display Name</label>
              <input
                type="text"
                placeholder="e.g., John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E0E0E0] dark:border-[#404040] dark:bg-[#404040] bg-white text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#999999] focus:ring-2 focus:ring-[#2F79F4] focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Gmail Address</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E0E0E0] dark:border-[#404040] dark:bg-[#404040] bg-white text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#999999] focus:ring-2 focus:ring-[#2F79F4] focus:border-transparent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Phone Number</label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#E0E0E0] dark:border-[#404040] dark:bg-[#404040] bg-white text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#999999] focus:ring-2 focus:ring-[#2F79F4] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-[#E0E0E0] dark:border-[#404040] dark:bg-[#404040] bg-white text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#999999] focus:ring-2 focus:ring-[#2F79F4] focus:border-transparent outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#2C2C2C] dark:text-[#a3a3a3] dark:hover:text-[#e5e5e5]"
                >
                  {showPassword ? <EyeOff size={20} className="text-current" /> : <Eye size={20} className="text-current" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full mt-6 py-3 px-4 bg-[#2F79F4] hover:bg-[#2563eb] text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow"
          >
            Create Account
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E0E0E0] dark:bg-[#404040]" />
            <span className="text-[#666666] dark:text-[#a3a3a3] text-sm">Or continue with</span>
            <div className="flex-1 h-px bg-[#E0E0E0] dark:bg-[#404040]" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 bg-white border border-[#E0E0E0] dark:bg-[#404040] dark:border-[#505050] rounded-xl text-[#2C2C2C] dark:text-[#e5e5e5] font-medium flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-[#505050] transition-colors disabled:opacity-50"
          >
            <Google size={24} className="text-current" />
            Sign up with Gmail
          </button>

          <p className="mt-6 text-center text-[#666666] dark:text-[#a3a3a3] text-sm">
            Already have an account?{" "}
            <button type="button" onClick={() => router.push("/login")} className="text-[#2F79F4] font-medium hover:underline">
              Log in
            </button>
          </p>

          <p className="mt-4 text-center text-xs text-[#666666] dark:text-[#a3a3a3]">
            By clicking &apos;Create Account&apos;, you agree to our{" "}
            <button type="button" onClick={() => router.push("/#terms")} className="text-[#2F79F4] hover:underline">Terms of Service</button>
            {" "}and{" "}
            <button type="button" onClick={() => router.push("/#privacy")} className="text-[#2F79F4] hover:underline">Privacy Policy</button>.
          </p>
        </form>
      </div>

      <AuthFooterRegister />
    </div>
  );
}
