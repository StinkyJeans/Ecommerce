"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/lib/edgestore";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { edgestore } = useEdgeStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setIdFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setIdPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setIdPreview(null);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    let idUrl = "";

    try {
      if (idFile) {
        // ✅ Upload image to EdgeStore properly
        const res = await edgestore.publicFiles.upload({ file: idFile });
        idUrl = res.url;
      }

      const response = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          email,
          contact,
          idUrl,
          role: "seller",
        }),
      });

      const data = await response.json();
      setPopupMessage(data.message || data.error || "Registration failed.");
      setShowPopup(true);

      if (response.ok) {
        setTimeout(() => router.push("/"), 2000);
      }
    } catch (err) {
      setPopupMessage("Upload or registration failed. " + err.message);
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 relative">
      {showPopup && (
        <div className="absolute top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-md animate-fade-in">
          {popupMessage}
        </div>
      )}

      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-lg shadow-md max-w-4xl w-full flex flex-col gap-6"
      >
        <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">
          Seller Registration
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* LEFT - UPLOAD BOX */}
          <div className="flex-1 flex flex-col items-center">
            <label className="mb-2 text-gray-700 font-medium">
              Upload ID Image
            </label>
            <div
              className="w-full h-56 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
              onClick={() => document.getElementById("idFileInput").click()}
            >
              {idPreview ? (
                <img
                  src={idPreview}
                  alt="ID Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <p className="text-gray-400">Click here to upload</p>
              )}
            </div>
            <input
              id="idFileInput"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              required
            />
          </div>

          {/* RIGHT - FORM INPUTS */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border w-full p-2 mb-4 rounded focus:ring-2 focus:ring-red-500 outline-none"
              required
            />

            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border w-full p-2 pr-10 rounded focus:ring-2 focus:ring-red-500 outline-none"
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
              className="border w-full p-2 mb-4 rounded focus:ring-2 focus:ring-red-500 outline-none"
              required
            />

            <input
              type="text"
              placeholder="Contact Number"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="border w-full p-2 mb-4 rounded focus:ring-2 focus:ring-red-500 outline-none"
              required
            />

            <button
              type="submit"
              className={`bg-red-600 text-white w-full py-2 rounded hover:bg-red-700 transition ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>

            <div className="flex gap-2 mt-2 justify-center text-sm">
              <p>Already have an Account?</p>
              <span
                onClick={() => router.push("/")}
                className="text-red-600 hover:text-red-400 cursor-pointer underline"
              >
                Login
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
