"use client";

import { useTheme } from "../context/ThemeContext";
import { Moon, Sun } from "griddy-icons";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 touch-manipulation bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <Moon size={20} className="text-gray-700 dark:text-gray-300" /> : <Sun size={20} className="text-gray-700 dark:text-gray-300" />}
    </button>
  );
}
