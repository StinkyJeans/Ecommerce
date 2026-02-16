"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Close } from "griddy-icons";
export default function SearchBar({ 
  placeholder = "Search products...", 
  onSearch, 
  className = "" 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const debounceTimerRef = useRef(null);
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, onSearch]);
  const handleSearch = (value) => {
    setSearchTerm(value);
  };
  const clearSearch = () => {
    setSearchTerm("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSearch("");
  };
  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <div className="relative flex items-center group">
        <Search
          size={18}
          className="absolute left-3 sm:left-4 text-[#666666] dark:text-[#a3a3a3] group-focus-within:text-[#FFBF00] pointer-events-none transition-colors"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base bg-white dark:bg-[#2C2C2C] border-2 border-[#E0E0E0] dark:border-[#404040] rounded-lg sm:rounded-xl text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#666666] dark:placeholder-[#a3a3a3] focus:outline-none focus:border-[#FFBF00] focus:ring-2 focus:ring-[#FFBF00]/30 transition-all touch-manipulation"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-2 sm:right-3 text-[#666666] dark:text-[#a3a3a3] hover:text-[#2C2C2C] dark:hover:text-[#e5e5e5] transition cursor-pointer p-1 sm:p-1.5 hover:bg-[#E0E0E0] dark:hover:bg-[#404040] rounded-lg touch-manipulation"
            aria-label="Clear search"
          >
            <Close size={18} className="text-current" />
          </button>
        )}
      </div>
    </div>
  );
}