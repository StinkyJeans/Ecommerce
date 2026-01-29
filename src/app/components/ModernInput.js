"use client";

import { memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ModernInput = memo(({ 
  label,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  error,
  className = "",
  ...props 
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FontAwesomeIcon 
              icon={icon} 
              className="text-gray-400 dark:text-gray-500 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors" 
            />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:border-orange-400 dark:focus:border-orange-500 focus:bg-orange-50/50 dark:focus:bg-gray-700/50 focus:ring-4 focus:ring-orange-200/50 dark:focus:ring-orange-900/50 transition-all outline-none text-base`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <FontAwesomeIcon icon="exclamation-circle" className="text-sm" />
          {error}
        </p>
      )}
    </div>
  );
});

ModernInput.displayName = "ModernInput";

export default ModernInput;
