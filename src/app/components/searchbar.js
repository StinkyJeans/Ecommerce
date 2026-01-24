"use client";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
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
      <div className="relative flex items-center">
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-3 sm:left-4 text-gray-400 pointer-events-none text-sm sm:text-base"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 sm:pl-11 pr-9 sm:pr-10 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition touch-manipulation"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-2 sm:right-3 text-gray-400 hover:text-gray-600 transition cursor-pointer p-1 touch-manipulation"
            aria-label="Clear search"
          >
            <FontAwesomeIcon icon={faTimes} className="text-sm sm:text-base" />
          </button>
        )}
      </div>
    </div>
  );
}