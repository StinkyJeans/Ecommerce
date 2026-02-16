"use client";

import { useState, useEffect, useRef } from "react";
import { City, Timer, Close } from "griddy-icons";

export default function CityAutocomplete({
  value = "",
  onChange,
  onCitySelect,
  placeholder = "Search for a city...",
  className = "",
  disabled = false,
  error = false
}) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [apiAvailable, setApiAvailable] = useState(true);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Update input value when value prop changes (for editing existing addresses)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/geocode/autocomplete?input=${encodeURIComponent(query)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        // API not configured or failed
        if (response.status === 503 || data.error?.includes("not configured")) {
          setApiAvailable(false);
          setSuggestions([]);
          setShowSuggestions(false);
        } else {
          setErrorMessage(data.error || "Failed to fetch suggestions");
          setSuggestions([]);
        }
        setIsLoading(false);
        return;
      }

      setApiAvailable(true);
      setSuggestions(data.suggestions || []);
      setShowSuggestions(data.suggestions?.length > 0);
    } catch (error) {
      console.error("Error fetching city suggestions:", error);
      setErrorMessage("Network error. Please try again.");
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce API calls (300ms)
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    onChange?.(suggestion.description);

    // Fetch place details for reverse geocoding
    setIsLoading(true);
    setErrorMessage("");

    try {
      // Use lat/lon for reverse geocoding (more reliable than place_id lookup)
      const params = new URLSearchParams();
      if (suggestion.lat && suggestion.lon) {
        params.set("lat", suggestion.lat);
        params.set("lon", suggestion.lon);
      } else if (suggestion.placeId) {
        params.set("place_id", suggestion.placeId);
      }

      const response = await fetch(
        `/api/geocode/details?${params.toString()}`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Call callback with location data
        onCitySelect?.({
          city: data.city || suggestion.mainText,
          province: data.province || "",
          country: data.country || "",
          formattedAddress: data.formattedAddress || suggestion.description
        });
      } else {
        // Still call callback with what we have
        onCitySelect?.({
          city: suggestion.mainText,
          province: "",
          country: "",
          formattedAddress: suggestion.description
        });
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      // Still call callback with what we have
      onCitySelect?.({
        city: suggestion.mainText,
        province: "",
        country: "",
        formattedAddress: suggestion.description
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    onChange?.("");
    onCitySelect?.(null);
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <City size={16} className={`text-sm ${error ? "text-red-400" : "text-gray-400"}`} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none ${
            error
              ? "border-red-300 bg-red-50"
              : "border-gray-300"
          } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""} ${className}`}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
          {isLoading && (
            <Timer size={16} className="text-gray-400 text-sm animate-spin" />
          )}
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Close size={16} className="text-sm" />
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.placeId}-${index}`}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900 text-sm">
                {suggestion.mainText}
              </div>
              {suggestion.secondaryText && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {suggestion.secondaryText}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {!apiAvailable && inputValue.length >= 2 && (
        <p className="mt-1 text-xs text-gray-500">
          Geocoding service unavailable. You can still type manually.
        </p>
      )}
    </div>
  );
}
