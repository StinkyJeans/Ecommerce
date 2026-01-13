"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faCheckCircle,
  faTimes,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("error");
  const router = useRouter();

  useLoadingFavicon(loading, "Forgot Password");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setPopupMessage("Please enter your email address");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPopupMessage("Please enter a valid email address");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/resetPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPopupMessage(
          data.message ||
            "Password reset email sent! Please check your email."
        );
        setPopupType("success");
      } else {
        // Always show success message to prevent email enumeration
        setPopupMessage(
          data.message ||
            "If an account with that email exists, a password reset email has been sent."
        );
        setPopupType("success");
      }
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 6000);
    } catch (error) {
      console.error("Reset password error:", error);
      setPopupMessage("Something went wrong. Please try again later.");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
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
        <div
          className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-5 z-50 max-w-sm sm:max-w-md mx-auto sm:mx-0 animate-fade-in ${
            popupType === "error"
              ? "bg-gradient-to-r from-red-500 to-red-600"
              : popupType === "warning"
              ? "bg-gradient-to-r from-yellow-500 to-orange-500"
              : "bg-gradient-to-r from-green-500 to-green-600"
          } text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-2xl flex items-start gap-3`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {popupType === "error" && (
              <FontAwesomeIcon icon={faTimes} className="text-lg sm:text-xl" />
            )}
            {popupType === "warning" && (
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-lg sm:text-xl"
              />
            )}
            {popupType === "success" && (
              <FontAwesomeIcon icon={faCheckCircle} className="text-lg sm:text-xl" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm sm:text-base break-words">
              {popupMessage}
            </p>
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
        onSubmit={handleSubmit}
        className="relative bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 hover:shadow-3xl"
      >
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Sending reset email...</p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-4 shadow-lg">
            <FontAwesomeIcon icon={faEnvelope} className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Forgot Password
          </h1>
          <p className="text-gray-500 text-sm">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 text-sm" />
            </div>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-base"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation text-base"
        >
          Send Reset Link
        </button>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-gray-600 text-sm hover:text-red-600 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
}
