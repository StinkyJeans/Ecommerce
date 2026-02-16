"use client";

import { CheckCircle, Close, AlertTriangle } from "griddy-icons";

const STYLES = {
  success: "bg-[#4CAF50]",
  exists: "bg-[#FFBF00]",
  login: "bg-[#e6ac00]",
  error: "bg-[#F44336]",
};

const ICONS = {
  success: CheckCircle,
  exists: AlertTriangle,
  login: AlertTriangle,
  error: Close,
};

const MESSAGES = {
  success: "Product added to cart successfully!",
  exists: "This product is already in your cart",
  error: "Failed to add product to cart",
  login: "Please Login to add this product to your cart.",
};

export default function CartToast({ message, onDismiss }) {
  if (!message) return null;

  const bg = STYLES[message] || STYLES.error;
  const IconComponent = ICONS[message] || Close;
  const text = MESSAGES[message] || MESSAGES.error;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-2 fade-in ${bg} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-start gap-3`}
    >
      <IconComponent size={20} className="flex-shrink-0 mt-0.5 text-white" />
      <p className="font-medium text-sm sm:text-base break-words flex-1">{text}</p>
      <button type="button" onClick={onDismiss} className="text-white/80 hover:text-white">
        <Close size={16} className="text-white" />
      </button>
    </div>
  );
}
