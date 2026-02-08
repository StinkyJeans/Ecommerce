"use client";

import { useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

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
    "px-4 py-2.5 bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#404040] rounded-xl text-[#2C2C2C] dark:text-[#e5e5e5] font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors";
  const dropdownClass =
    "absolute left-0 top-full mt-1 py-1 bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#404040] rounded-xl shadow-lg z-50 min-w-[200px]";
  const itemActive = "bg-[#FFBF00] text-[#2C2C2C] font-semibold";
  const itemInactive = "text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-gray-100 dark:hover:bg-[#404040]";

  return (
    <div ref={ref} className="mb-6 flex items-center justify-between gap-4 flex-wrap relative">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <button type="button" onClick={() => toggle("price")} className={btnClass}>
            Price Range
            <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${openDropdown === "price" ? "rotate-180" : ""}`} />
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
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${
                    priceRange[0] === preset.value[0] && priceRange[1] === preset.value[1] ? itemActive : itemInactive
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggle("rating")} className={btnClass}>
            Rating
            <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${openDropdown === "rating" ? "rotate-180" : ""}`} />
          </button>
          {openDropdown === "rating" && (
            <div className={`${dropdownClass} min-w-[160px]`}>
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setRatingFilter(opt.value);
                    setOpenDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${ratingFilter === opt.value ? itemActive : itemInactive}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggle("sort")} className={btnClass}>
            Sort By: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Newest"}
            <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${openDropdown === "sort" ? "rotate-180" : ""}`} />
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
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${sortBy === opt.value ? itemActive : itemInactive}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-[#666666] dark:text-[#a3a3a3]">
        Showing <span className="font-semibold text-[#2C2C2C] dark:text-[#e5e5e5]">{productCount}</span> products
      </p>
    </div>
  );
}
