"use client";

import { useRef, useEffect } from "react";
import { ChevronDown } from "griddy-icons";

const PRICE_PRESETS = [
  { label: "Any price", value: [0, 999999999] },
  { label: "Under ₱1,000", value: [0, 999] },
  { label: "₱1,000 - ₱10,000", value: [1000, 10000] },
  { label: "₱10,000 - ₱50,000", value: [10000, 50000] },
  { label: "₱50,000 - ₱100,000", value: [50000, 100000] },
  { label: "Over ₱100,000", value: [100001, 999999999] },
];

const RATING_OPTIONS = [
  { label: "All ratings", value: "all" },
  { label: "4+ stars", value: "4" },
  { label: "3+ stars", value: "3" },
  { label: "2+ stars", value: "2" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
];

export default function CategoryFilters({
  priceRange,
  setPriceRange,
  ratingFilter,
  setRatingFilter,
  sortBy,
  setSortBy,
  openDropdown,
  setOpenDropdown,
  productCount,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpenDropdown(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [setOpenDropdown]);

  const toggle = (key) => setOpenDropdown((d) => (d === key ? null : key));
  const btnClass =
    "w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#404040] rounded-lg sm:rounded-xl text-sm sm:text-base text-[#2C2C2C] dark:text-[#e5e5e5] font-semibold flex items-center justify-between sm:justify-center gap-2 hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors";
  const dropdownClass =
    "absolute left-0 right-0 sm:right-auto top-full mt-1 py-1 bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#404040] rounded-lg sm:rounded-xl shadow-lg z-50 sm:min-w-[200px]";
  const itemActive = "bg-[#FFBF00] text-white font-semibold";
  const itemInactive = "text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-gray-100 dark:hover:bg-[#404040]";

  return (
    <div ref={ref} className="mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1">
          <div className="relative w-full sm:w-auto">
            <button type="button" onClick={() => toggle("price")} className={btnClass}>
              <span>Price Range</span>
              <ChevronDown size={14} className={`text-xs transition-transform flex-shrink-0 ${openDropdown === "price" ? "rotate-180" : ""}`} />
            </button>
            {openDropdown === "price" && (
              <div className={dropdownClass}>
                {PRICE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setPriceRange(preset.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg transition-colors ${
                      priceRange[0] === preset.value[0] && priceRange[1] === preset.value[1] ? itemActive : itemInactive
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-auto">
            <button type="button" onClick={() => toggle("rating")} className={btnClass}>
              <span>Rating</span>
              <ChevronDown size={14} className={`text-xs transition-transform flex-shrink-0 ${openDropdown === "rating" ? "rotate-180" : ""}`} />
            </button>
            {openDropdown === "rating" && (
              <div className={`${dropdownClass} sm:min-w-[160px]`}>
                {RATING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setRatingFilter(opt.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg transition-colors ${ratingFilter === opt.value ? itemActive : itemInactive}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-auto">
            <button type="button" onClick={() => toggle("sort")} className={btnClass}>
              <span className="truncate">Sort By: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Newest"}</span>
              <ChevronDown size={14} className={`text-xs transition-transform flex-shrink-0 ${openDropdown === "sort" ? "rotate-180" : ""}`} />
            </button>
            {openDropdown === "sort" && (
              <div className={dropdownClass}>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSortBy(opt.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-sm rounded-lg transition-colors ${sortBy === opt.value ? itemActive : itemInactive}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs sm:text-sm text-[#666666] dark:text-[#a3a3a3] text-center sm:text-left whitespace-nowrap">
          Showing <span className="font-semibold text-[#2C2C2C] dark:text-[#e5e5e5]">{productCount}</span> products
        </p>
      </div>
    </div>
  );
}
