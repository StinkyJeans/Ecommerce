"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { authFunctions } from "@/lib/supabase/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faStore,
  faCheckCircle,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useLoadingFavicon(loading, "Register");

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authFunctions.register({ displayName, email, password, role: "user" });
      setPopupMessage(data.message || "User registered successfully");
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
        router.push("/");
      }, 2000);
    } catch (error) {
      const errorMessage = error.message || "Registration failed";
      setPopupMessage(errorMessage);
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const Login = () => {
    router.push("/");
  };

  const sellerRegister = () => {
    router.push("/sellerRegister");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>
      </div>

      {showPopup && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:right-5 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-2xl animate-fade-in z-50 flex items-center gap-2 sm:gap-3 max-w-sm sm:max-w-md mx-auto sm:mx-0">
          <FontAwesomeIcon icon={faCheckCircle} className="text-lg sm:text-xl flex-shrink-0" />
          <span className="font-medium text-sm sm:text-base break-words">{popupMessage}</span>
        </div>
      )}

      <form
        onSubmit={handleRegister}
        className="relative bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 hover:shadow-3xl"
      >
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Creating account...</p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full mb-4 shadow-lg">
            <FontAwesomeIcon icon={faUserPlus} className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Create Account
          </h1>
          <p className="text-gray-500 text-sm">
            Join TotallyNormal Store today
          </p>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faUser} className="text-gray-400 text-sm" />
            </div>
            <input
              type="text"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-base"
              required
            />
          </div>
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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-base"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation text-base"
        >
          <span className="flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faUserPlus} className="text-base sm:text-lg" style={{ width: '1em', height: '1em', maxWidth: '100%' }} />
            Register
          </span>
        </button>

        <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faStore} className="text-red-600 text-lg mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800 mb-1">
                Want to sell on our platform?
              </p>
              <button
                type="button"
                onClick={sellerRegister}
                className="cursor-pointer text-red-600 hover:text-red-700 font-semibold text-sm underline underline-offset-2 transition-colors"
              >
                Register as a Seller →
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <span
              onClick={Login}
              className="text-red-600 hover:text-red-700 font-semibold cursor-pointer underline underline-offset-2 transition-colors"
            >
              Login here
            </span>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-xs text-gray-500">
            By registering, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </form>
    </div>
  );
}