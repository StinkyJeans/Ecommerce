"use client";

import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ModernButton = memo(({ 
  children, 
  onClick, 
  type = "button", 
  variant = "primary", 
  size = "md",
  disabled = false,
  loading = false,
  icon,
  className = "",
  ...props 
}) => {
  const baseStyles = "font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group";
  
  const variants = {
    primary: "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-md hover:shadow-lg",
    secondary: "bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
    outline: "bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
  };
  
  const sizes = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-4 px-8 text-lg"
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-3">
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && <FontAwesomeIcon icon={icon} className="text-xl" />}
            {children}
          </>
        )}
      </span>
      {variant === "primary" && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      )}
    </button>
  );
});

ModernButton.displayName = "ModernButton";

export default ModernButton;
