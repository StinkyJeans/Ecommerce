"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validatePasswordStrength } from "@/lib/validation";
import { authFunctions } from "@/lib/supabase/api";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faEye,
  faEyeSlash,
  faCheckCircle,
  faTimes,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("error");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useLoadingFavicon(loading, "Reset Password");

  useEffect(() => {
    if (!supabase) {
      setPopupMessage("Unable to initialize. Please try again.");
      setPopupType("error");
      setShowPopup(true);
    }
  }, [supabase]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setPopupMessage("Please fill in all fields");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
      return;
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      setPopupMessage(passwordValidation.errors.join(". "));
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 5000);
      return;
    }

    if (password !== confirmPassword) {
      setPopupMessage("Passwords do not match");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
      return;
    }

    if (!supabase) {
      setPopupMessage("Unable to initialize. Please try again.");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setPopupMessage(error.message || "Failed to reset password. The link may have expired.");
        setPopupType("error");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000);
        return;
      }

      try {
        await authFunctions.updatePasswordChangedAt();
      } catch (err) {

      }

      setPopupMessage("Password reset successfully! Redirecting to login...");
      setPopupType("success");
      setShowPopup(true);

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      setPopupMessage("Something went wrong. Please try again.");
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
        onSubmit={handleResetPassword}
        className="relative bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 hover:shadow-3xl"
      >
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Resetting password...</p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-4 shadow-lg">
            <FontAwesomeIcon icon={faLock} className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-500 text-sm">
            Enter your new password
          </p>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faLock} className="text-gray-400 text-sm" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-base"
              required
              minLength={6}
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
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faLock} className="text-gray-400 text-sm" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-base"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FontAwesomeIcon
                icon={showConfirmPassword ? faEyeSlash : faEye}
                className="text-sm"
              />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation text-base"
        >
          Reset Password
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
