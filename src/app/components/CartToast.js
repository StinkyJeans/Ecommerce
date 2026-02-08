"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimes, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

const STYLES = {
  success: "bg-[#4CAF50]",
  exists: "bg-[#FFBF00]",
  login: "bg-[#2F79F4]",
  error: "bg-[#F44336]",
};

const ICONS = {
  success: faCheckCircle,
  exists: faExclamationTriangle,
  login: faExclamationTriangle,
  error: faTimes,
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
  const icon = ICONS[message] || faTimes;
  const text = MESSAGES[message] || MESSAGES.error;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-2 fade-in ${bg} text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-start gap-3`}
    >
      <FontAwesomeIcon icon={icon} className="text-lg flex-shrink-0 mt-0.5" />
      <p className="font-medium text-sm sm:text-base break-words flex-1">{text}</p>
      <button type="button" onClick={onDismiss} className="text-white/80 hover:text-white">
        <FontAwesomeIcon icon={faTimes} className="text-sm" />
      </button>
    </div>
  );
}
