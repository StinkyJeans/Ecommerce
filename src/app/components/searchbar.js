"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";

export default function SearchBar({ 
  placeholder = "Search products...", 
  onSearch, 
  className = "" 
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <div className="relative flex items-center">
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-4 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            aria-label="Clear search"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>
    </div>
  );
}