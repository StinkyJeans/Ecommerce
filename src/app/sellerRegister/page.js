"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { authFunctions } from "@/lib/supabase/api";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faIdCard,
  faShieldAlt,
  faEnvelope,
  faPhone,
  faLock,
  faEye,
  faEyeSlash,
  faCheckCircle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { AuthHeaderSeller } from "@/app/components/auth/AuthHeader";
import { AuthFooterSeller } from "@/app/components/auth/AuthFooter";

const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,application/pdf";

export default function SellerRegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupError, setPopupError] = useState(false);

  useLoadingFavicon(loading, "Become a Seller");

  const handleFile = (file) => {
    if (!file || !ACCEPT.split(",").some((t) => file.type === t.trim())) return;
    setIdFile(file);
    if (file.type.startsWith("image/")) {
      const r = new FileReader();
      r.onloadend = () => setIdPreview(r.result);
      r.readAsDataURL(file);
    } else {
      setIdPreview(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };
  const onDragOver = (e) => e.preventDefault();

  const handleFileChange = (e) => handleFile(e.target.files?.[0]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!idFile) {
      setPopupMessage("Please upload your ID document.");
      setPopupError(true);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
      return;
    }
    setLoading(true);
    let idUrl = "";
    try {
      const formData = new FormData();
      formData.append("file", idFile);
      formData.append("email", email);
      const res = await fetch("/api/upload-seller-id", { method: "POST", body: formData });
      const up = await res.json();
      if (!res.ok) throw new Error(up.error || up.message || "Upload failed.");
      if (!up.url) throw new Error("Upload succeeded but no URL returned.");
      idUrl = up.url;
    } catch (err) {
      setPopupMessage("Upload failed: " + (err.message || "Please try again."));
      setPopupError(true);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 5000);
      setLoading(false);
      return;
    }
    try {
      const data = await authFunctions.sellerRegister({ displayName, password, email, contact, idUrl });
      const ok = data?.message && data.success !== false && !data.error && !data.errors;
      if (ok) {
        setPopupMessage(data.details ? `${data.message}\n\n${data.details}` : data.message);
        setPopupError(false);
        setShowPopup(true);
        setTimeout(() => { setShowPopup(false); router.push("/"); }, 6000);
      } else {
        setPopupMessage(data?.error || data?.message || (Array.isArray(data?.errors) ? data.errors.join(". ") : "Registration failed."));
        setPopupError(true);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000);
      }
    } catch (err) {
      let msg = "Registration failed. Please try again.";
      if (err.response?.errors && Array.isArray(err.response.errors)) msg = err.response.errors.join(". ");
      else if (err.response?.message) msg = err.response.message;
      else if (err.message) msg = err.message;
      setPopupMessage(msg);
      setPopupError(true);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] flex flex-col">
      <AuthHeaderSeller />

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        {showPopup && (
          <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-fade-in ${
            popupError ? "bg-[#F44336]" : "bg-[#4CAF50]"
          } text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-start gap-3`}>
            <FontAwesomeIcon icon={popupError ? faTimes : faCheckCircle} className="text-lg flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{popupError ? "Error" : "Application submitted"}</p>
              <p className="text-sm mt-1 break-words whitespace-pre-line">{popupMessage}</p>
            </div>
            <button onClick={() => setShowPopup(false)} className="text-white/80 hover:text-white">
              <FontAwesomeIcon icon={faTimes} className="text-sm" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleRegister}
          className="relative w-full max-w-4xl bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-lg border border-[#E0E0E0] dark:border-[#404040] overflow-hidden"
        >
          {loading && (
            <div className="absolute inset-0 bg-white/90 dark:bg-[#2C2C2C]/95 rounded-2xl flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-[#E0E0E0] dark:border-[#404040] border-t-[#FFBF00] rounded-full loading-spinner-animated" />
                <p className="text-[#2C2C2C] dark:text-[#e5e5e5] font-medium">Submitting application...</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#E0E0E0] dark:divide-[#404040]">
            {/* Left: Become a Seller + Verification */}
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-bold text-[#2C2C2C] dark:text-white">Become a Seller</h2>
              <p className="text-[#666666] dark:text-[#a3a3a3] text-sm mt-1 mb-6">Join our global marketplace and reach millions of customers today.</p>
              <h3 className="text-sm font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] mb-3">Verification Documents</h3>
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E0E0E0] dark:border-[#404040] rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center min-h-[180px] cursor-pointer bg-gray-50 dark:bg-[#404040]/30 hover:border-[#FFBF00] transition-colors"
              >
                {idPreview ? (
                  <img src={idPreview} alt="ID preview" className="max-h-32 rounded-lg object-contain mx-auto mb-2" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faIdCard} className="text-4xl text-[#FFBF00] mb-3" />
                    <p className="text-[#666666] dark:text-[#a3a3a3] text-sm text-center mb-2">
                      Drag and drop your ID card image here, or click to browse.
                    </p>
                    <p className="text-[#999999] text-xs mb-3">Accepted formats: JPG, PNG, PDF.</p>
                  </>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="px-4 py-2 bg-[#FFF8E1] border border-[#FFDA6A] text-[#2C2C2C] dark:text-[#FFBF00] rounded-lg text-sm font-medium hover:bg-[#FFDA6A]/30"
                >
                  Select File
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="mt-4 p-3 rounded-xl bg-[#FFF8E1] dark:bg-[#FFF8E1]/10 border border-[#FFDA6A] dark:border-[#FFDA6A]/50 flex gap-3">
                <FontAwesomeIcon icon={faShieldAlt} className="text-[#FFBF00] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#2C2C2C] dark:text-[#e5e5e5]">
                  Your data is protected by industry-standard encryption. We only use your ID for merchant verification purposes and do not share it with third parties.
                </p>
              </div>
            </div>

            {/* Right: Business Details */}
            <div className="p-6 sm:p-8">
              <h3 className="text-sm font-bold text-[#666666] dark:text-[#a3a3a3] uppercase tracking-wide">Business Details</h3>
              <p className="text-[#666666] dark:text-[#a3a3a3] text-sm mt-1 mb-6">Enter the name customers will see on your storefront.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Display Name</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
                      <FontAwesomeIcon icon={faStore} className="text-sm" />
                    </div>
                    <input
                      type="text"
                      placeholder="Totally Awesome Goods"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E0E0E0] dark:border-[#404040] dark:bg-[#404040] bg-white text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#999999] focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Business Email</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
                      <FontAwesomeIcon icon={faEnvelope} className="text-sm" />
                    </div>
                    <input
                      type="email"
                      placeholder="seller@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E0E0E0] dark:border-[#404040] dark:bg-[#404040] bg-white text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#999999] focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
                      <FontAwesomeIcon icon={faPhone} className="text-sm" />
                    </div>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E0E0E0] dark:border-[#404040] dark:bg-[#404040] bg-white text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#999999] focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]">
                      <FontAwesomeIcon icon={faLock} className="text-sm" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-[#E0E0E0] dark:border-[#404040] dark:bg-[#404040] bg-white text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#999999] focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#2C2C2C] dark:text-[#a3a3a3] dark:hover:text-[#e5e5e5]"
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !idFile}
                className="w-full mt-6 py-3 px-4 bg-[#FFBF00] hover:bg-[#e6ac00] text-[#2C2C2C] font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow"
              >
                Submit Application
              </button>

              <p className="mt-6 text-center text-[#666666] dark:text-[#a3a3a3] text-sm">
                Already have a seller account?{" "}
                <button type="button" onClick={() => router.push("/login")} className="text-[#FFBF00] font-medium hover:underline">
                  Log in
                </button>
              </p>
            </div>
          </div>
        </form>
      </div>

      <AuthFooterSeller />
    </div>
  );
}
