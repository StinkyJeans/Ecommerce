"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { authFunctions } from "@/lib/supabase/api";
import { setSigningKey } from "@/lib/signing-client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faSignInAlt,
  faExclamationTriangle,
  faTimes,
  faCheckCircle,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

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
  const { setRole } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useLoadingFavicon(loading || googleLoading, "Login");

  const register = () => router.push("/register");

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
      const redirectUrl = `${window.location.origin}/auth/callback?next=/dashboard`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {

        let errorMessage = "Failed to sign in with Google. Please try again.";

        if (error.message && error.message.includes("provider is not enabled")) {
          errorMessage = "Google login is not enabled. Please contact the administrator or use username/password login.";
        } else if (error.message) {
          errorMessage = `Google login error: ${error.message}`;
        }

        setPopupMessage(errorMessage);
        setPopupType("error");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 6000);
        setGoogleLoading(false);
      }
    } catch (error) {

      let errorMessage = "Something went wrong. Please try again.";

      if (error.message && error.message.includes("provider is not enabled")) {
        errorMessage = "Google login is not enabled. Please contact the administrator or use username/password login.";
      }

      setPopupMessage(errorMessage);
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 6000);
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

      setRole(data.role);

      if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else if (data.role === "seller") {
        router.push("/seller/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {

      setPasswordChangedMessage("");

      const errorData = error.response || {};
      const status = error.status || 500;

      if (status === 403 && errorData.sellerStatus === 'pending') {
        setPopupMessage(errorData.details || "Waiting for admin approval. Please wait for admin approval before logging in.");
        setPopupType("warning");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000);
      } else if (status === 403 && errorData.sellerStatus === 'rejected') {
        setPopupMessage(errorData.details || "Your seller account has been rejected. Please contact support.");
        setPopupType("error");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000);
      } else {
        const errorMessage = errorData.message || error.message || "Invalid Email or Password";

        setPopupMessage(errorMessage);
        setPopupType("error");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 4000);

        if (errorData.passwordChangedAt) {
          const relativeTime = formatRelativeTime(errorData.passwordChangedAt);
          setPasswordChangedMessage(`You have changed your password ${relativeTime}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>
      </div>

      {showPopup && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-5 z-50 max-w-sm sm:max-w-md mx-auto sm:mx-0 animate-fade-in ${
          popupType === 'error' 
            ? 'bg-gradient-to-r from-red-500 to-red-600' 
            : popupType === 'warning'
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
            : 'bg-gradient-to-r from-green-500 to-green-600'
        } text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-2xl flex items-start gap-3`}>
          <div className="flex-shrink-0 mt-0.5">
            {popupType === 'error' && <FontAwesomeIcon icon={faTimes} className="text-lg sm:text-xl" />}
            {popupType === 'warning' && <FontAwesomeIcon icon={faExclamationTriangle} className="text-lg sm:text-xl" />}
            {popupType === 'success' && <FontAwesomeIcon icon={faCheckCircle} className="text-lg sm:text-xl" />}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm sm:text-base break-words">{popupMessage}</p>
          </div>
          <button
            onClick={() => setShowPopup(false)}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
          </button>
        </div>
      )}

      <form
        onSubmit={handleLogin}
        className="relative bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 hover:shadow-3xl"
      >
        {(loading || googleLoading) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">{googleLoading ? "Redirecting to Google..." : "Logging in..."}</p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-4 shadow-lg">
            <FontAwesomeIcon icon={faStore} className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500 text-sm">
            Sign in to TotallyNormal Store
          </p>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 text-sm" />
            </div>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-base"
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faLock} className="text-gray-400 text-sm" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordChangedMessage) {
                  setPasswordChangedMessage("");
                }
              }}
              className="w-full pl-10 pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-base"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                className="text-sm"
              />
            </button>
          </div>
          {passwordChangedMessage && (
            <div className="mt-2 flex items-start gap-2 text-sm text-amber-600">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mt-0.5 flex-shrink-0" />
              <p className="flex-1">{passwordChangedMessage}</p>
            </div>
          )}
          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={() => router.push("/auth/forgot-password")}
              className="text-sm text-red-600 hover:text-red-700 font-semibold cursor-pointer underline underline-offset-2 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation text-base"
        >
          <span className="cursor-pointer flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faSignInAlt} className="text-base sm:text-lg" style={{ width: '1em', height: '1em', maxWidth: '100%' }} />
            Login
          </span>
        </button>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-500 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="cursor-pointer w-full mt-4 py-3 sm:py-3.5 px-4 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation text-base flex items-center justify-center gap-3"
        >
          <FontAwesomeIcon icon={faGoogle} className="text-xl text-red-600" />
          <span>Continue with Google</span>
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <span
              onClick={register}
              className="text-red-600 hover:text-red-700 font-semibold cursor-pointer underline underline-offset-2 transition-colors"
            >
              Register now
            </span>
          </p>
        </div>
      </form>
    </div>
  );
}
