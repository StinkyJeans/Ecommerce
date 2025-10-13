"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setRole } = useAuth();
  const router = useRouter();

  const register = () => router.push("/register");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (data.role === "admin") {
        router.push("/admin/dashboard");
      } else if (data.role === "seller") {
        router.push("/seller/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm relative"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Login To Stupidshits Store
        </h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 mb-4 border rounded"
          required
        />

        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 pr-10 border rounded"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded cursor-pointer ${
            loading ? "bg-gray-400" : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2">
            <div className="h-5 w-5 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
          </div>
        )}

        <div className="flex gap-2 mt-2 justify-center text-sm">
          <p>Don't have an Account?</p>
          <span
            onClick={register}
            className="text-red-600 hover:text-red-400 cursor-pointer underline"
          >
            Register
          </span>
        </div>
      </form>
    </div>
  );
}
