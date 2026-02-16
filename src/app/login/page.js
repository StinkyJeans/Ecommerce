"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { authFunctions } from "@/lib/supabase/api";
import { setSigningKey } from "@/lib/signing-client";
import { ShoppingBag, Eye, EyeOff, AlertTriangle, Close, CheckCircle, Google } from "griddy-icons";
import { AuthHeaderLogin } from "@/app/components/auth/AuthHeader";
import { AuthFooterLogin } from "@/app/components/auth/AuthFooter";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("error");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordChangedMessage, setPasswordChangedMessage] = useState("");
  const { setRole, setUsername } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useLoadingFavicon(loading || googleLoading, "Login");

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setPopupMessage("Unable to initialize. Please try again.");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
      return;
    }
    setGoogleLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl },
      });
      if (error) {
        let msg = "Failed to sign in with Google. Please try again.";
        if (error.message?.includes("provider is not enabled"))
          msg = "Google login is not enabled. Please contact the administrator or use email/password.";
        else if (error.message) msg = `Google login error: ${error.message}`;
        setPopupMessage(msg);
        setPopupType("error");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 6000);
      }
    } catch (err) {
      let msg = "Something went wrong. Please try again.";
      if (err.message?.includes("provider is not enabled"))
        msg = "Google login is not enabled. Please contact the administrator or use email/password.";
      setPopupMessage(msg);
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 6000);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authFunctions.login({ email, password });
      setPasswordChangedMessage("");
      if (data.signingKey) setSigningKey(data.signingKey);
      if (data.role) setRole(data.role);
      if (data.username) setUsername(data.username);
      if (data.role === "admin") router.push("/admin/dashboard");
      else if (data.role === "seller") router.push("/seller/dashboard");
      else router.push("/");
    } catch (error) {
      setPasswordChangedMessage("");
      const err = error.response || {};
      const status = error.status || 500;
      if (status === 403 && err.sellerStatus === "pending") {
        setPopupMessage(err.details || "Waiting for admin approval. Please wait before logging in.");
        setPopupType("warning");
      } else if (status === 403 && err.sellerStatus === "rejected") {
        setPopupMessage(err.details || "Your seller account has been rejected. Please contact support.");
        setPopupType("error");
      } else {
        setPopupMessage(err.message || error.message || "Invalid Email or Password");
        setPopupType("error");
        if (err.passwordChangedAt)
          setPasswordChangedMessage(`You have changed your password ${formatRelativeTime(err.passwordChangedAt)}`);
      }
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), status === 403 ? 5000 : 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] flex flex-col">
      <AuthHeaderLogin />

      <div className="flex-1 flex items-center justify-center p-4">
        {showPopup && (
          <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-5 z-50 max-w-sm sm:max-w-md animate-fade-in bg-red-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-start gap-3`}>
            {popupType === "success" ? <CheckCircle size={20} className="flex-shrink-0 mt-0.5 text-white" /> : popupType === "warning" ? <AlertTriangle size={20} className="flex-shrink-0 mt-0.5 text-white" /> : <Close size={20} className="flex-shrink-0 mt-0.5 text-white" />}
            <p className="font-medium text-sm sm:text-base break-words flex-1">{popupMessage}</p>
            <button onClick={() => setShowPopup(false)} className="text-white/80 hover:text-white">
              <Close size={16} className="text-white" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="relative w-full max-w-md bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-lg border border-[#E0E0E0] dark:border-[#404040] p-6 sm:p-8"
        >
          {(loading || googleLoading) && (
            <div className="absolute inset-0 bg-white/95 dark:bg-[#2C2C2C]/95 rounded-2xl flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <LoadingSpinner size="md" color="blue" />
                <p className="text-[#2C2C2C] dark:text-[#e5e5e5] font-medium">{googleLoading ? "Redirecting to Google..." : "Signing in..."}</p>
              </div>
            </div>
          )}

          <div className="text-center mb-6">
            <div className="inline-flex w-12 h-12 bg-[#2F79F4] rounded-lg items-center justify-center mb-4 shadow">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2C2C] dark:text-white">Welcome back</h1>
            <p className="text-[#666666] dark:text-[#a3a3a3] text-sm mt-1">Sign in to your Totally Normal account</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 bg-white border border-[#E0E0E0] dark:bg-[#404040] dark:border-[#505050] rounded-xl text-[#2C2C2C] dark:text-[#e5e5e5] font-medium flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors disabled:opacity-50"
          >
            <Google size={24} className="text-current" />
            Login with Gmail
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#E0E0E0] dark:bg-[#404040]" />
            <span className="text-[#666666] dark:text-[#a3a3a3] text-sm font-medium">OR</span>
            <div className="flex-1 h-px bg-[#E0E0E0] dark:bg-[#404040]" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E0E0E0] dark:border-[#404040] dark:bg-[#404040] bg-white text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#999999] focus:ring-2 focus:ring-[#2F79F4] focus:border-transparent outline-none"
              required
            />
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5]">Password</label>
              <button
                type="button"
                onClick={() => router.push("/auth/forgot-password")}
                className="text-sm text-[#2F79F4] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (passwordChangedMessage) setPasswordChangedMessage(""); }}
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
            {passwordChangedMessage && (
              <p className="mt-2 text-sm text-[#FFBF00] dark:text-[#FFC107]">{passwordChangedMessage}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 bg-[#2F79F4] hover:bg-[#2563eb] text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow"
          >
            Sign In
          </button>

          <p className="mt-6 text-center text-[#666666] dark:text-[#a3a3a3] text-sm">
            Don&apos;t have an account?{" "}
            <button type="button" onClick={() => router.push("/register")} className="text-[#2F79F4] font-medium hover:underline">
              Sign Up
            </button>
          </p>
        </form>
      </div>

      <AuthFooterLogin />
    </div>
  );
}
