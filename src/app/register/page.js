"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password}),
    });

    const data = await res.json();

    setPopupMessage(data.message || data.error);
    setShowPopup(true);

    setTimeout(() => {
      setShowPopup(false);
      if (res.ok) router.push("/");
    }, 2000);
  };

  const Login = () => {
    router.push("/");
  };

  const sellerRegister = () => {
    router.push("/sellerRegister");
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 relative">
      {showPopup && (
        <div className="absolute top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-md animate-fade-in">
          {popupMessage}
        </div>
      )}

      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded shadow-md w-80 relative"
      >
        <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>

        <input
          type="text"
          placeholder="Username"
          className="border w-full p-2 mb-3 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="border w-full p-2 pr-10 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          className="bg-red-600 text-white w-full py-2 rounded hover:bg-red-700 cursor-pointer"
        >
          Register
        </button>
        <div className="flex gap-2 mt-2 justify-center text-sm">
          <p>Want to register as a Seller?</p>
          <span
            onClick={sellerRegister}
            className="text-red-600 hover:text-red-400 cursor-pointer underline"
          >
            Register
          </span>
        </div>
        <div className="flex gap-2 mt-2 justify-center text-sm">
          <p>Already Have an Account?</p>
          <span
            onClick={Login}
            className="text-red-600 hover:text-red-400 cursor-pointer underline"
          >
            Login
          </span>
        </div>
      </form>
    </div>
  );
}
