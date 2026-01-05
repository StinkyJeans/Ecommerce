"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEdgeStore } from "@/lib/edgestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faIdCard,
  faSyncAlt,
  faCloudUploadAlt,
  faShieldAlt,
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faEnvelope,
  faPhone,
  faCheckCircle,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { edgestore } = useEdgeStore();

  const [sellerUsername, setSellerUsername] = useState("");
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
        const res = await edgestore.publicFiles.upload({ file: idFile });
        idUrl = res.url;
      }

      const response = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerUsername,
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 p-4 relative">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>
      </div>

      {showPopup && (
        <div className="fixed top-5 right-5 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg shadow-2xl animate-fade-in z-50 flex items-center gap-3">
          <FontAwesomeIcon icon={faCheckCircle} className="text-xl" />
          <span className="font-medium">{popupMessage}</span>
        </div>
      )}

      <form
        onSubmit={handleRegister}
        className="relative bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl max-w-5xl w-full"
      >

        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Registering seller account...</p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full mb-4 shadow-lg">
            <FontAwesomeIcon icon={faStore} className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Become a Seller
          </h1>
          <p className="text-gray-500 text-sm">
            Start selling on Stupidshits Store today
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <FontAwesomeIcon icon={faIdCard} className="mr-2 text-red-600" />
              Upload Valid ID
            </label>
            <div
              className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all group relative overflow-hidden"
              onClick={() => document.getElementById("idFileInput").click()}
            >
              {idPreview ? (
                <>
                  <img
                    src={idPreview}
                    alt="ID Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <FontAwesomeIcon icon={faSyncAlt} className="text-white text-3xl" />
                      <p className="text-white font-medium mt-2">Change Image</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <FontAwesomeIcon icon={faCloudUploadAlt} className="text-5xl text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium mb-2">
                    Click to upload your ID
                  </p>
                  <p className="text-gray-400 text-sm">
                    PNG, JPG up to 10MB
                  </p>
                </div>
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
            <p className="mt-3 text-xs text-gray-500 flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldAlt} className="text-green-600" />
              Your ID is securely encrypted and used for verification only
            </p>
          </div>

          <div className="flex-1 space-y-5">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seller Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={sellerUsername}
                  onChange={(e) => setSellerUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-base"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faLock} className="text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
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
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-base"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
            </div>
            <input
              type="tel"
              placeholder="09123456789"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-base"
              required
            />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 px-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6 touch-manipulation text-base"
            >
              <span className="cursor-pointer flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faCheckCircle} />
                Register as Seller
              </span>
            </button>

            <div className="text-center pt-4">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <span
                  onClick={() => router.push("/")}
                  className="text-red-600 hover:text-red-700 font-semibold cursor-pointer underline underline-offset-2 transition-colors"
                >
                  Login here
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 text-lg mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-800 mb-1">
                Seller Verification Process
              </p>
              <p className="text-xs text-gray-600">
                Your account will be reviewed within 24-48 hours. You'll receive an email once approved to start selling.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};