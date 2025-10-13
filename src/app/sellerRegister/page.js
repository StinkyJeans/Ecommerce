"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SellerRegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    let idUrl = "";

    if (idFile) {
      const formData = new FormData();
      formData.append("file", idFile);

      try {
        const uploadRes = await fetch("/api/edgeStore", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const text = await uploadRes.text();
          throw new Error(text || "Failed to upload ID.");
        }

        const uploadData = await uploadRes.json();
        if (!uploadData.publicFiles || !uploadData.publicFiles[0]?.url) {
          throw new Error("No file URL returned from EdgeStore.");
        }

        idUrl = uploadData.publicFiles[0].url;
      } catch (err) {
        setPopupMessage(err.message);
        setShowPopup(true);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email, contact, idUrl }),
      });

      const data = await res.json();
      setPopupMessage(data.message || data.error || "Registration failed.");
      setShowPopup(true);

      if (res.ok) {
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err) {
      setPopupMessage("Server error. Please try again.");
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    router.push("/");
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
        <h1 className="text-2xl font-bold mb-4 text-center">
          Seller Registration
        </h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border w-full p-2 mb-3 rounded"
          required
        />

        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border w-full p-2 pr-10 rounded"
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

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border w-full p-2 mb-3 rounded"
          required
        />

        <input
          type="text"
          placeholder="Contact Number"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="border w-full p-2 mb-3 rounded"
          required
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setIdFile(e.target.files[0])}
          className="border w-full p-2 mb-3 rounded"
          required
        />

        <button
          type="submit"
          className={`bg-red-600 text-white w-full py-2 rounded hover:bg-red-700 cursor-pointer ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <div className="flex gap-2 mt-2 justify-center text-sm">
          <p>Already have an Account?</p>
          <span
            onClick={login}
            className="text-red-600 hover:text-red-400 cursor-pointer underline"
          >
            Login
          </span>
        </div>
      </form>
    </div>
  );
}
