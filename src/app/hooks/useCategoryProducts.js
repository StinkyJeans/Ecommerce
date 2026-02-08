"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productFunctions } from "@/lib/supabase/api";

const ITEMS_PER_PAGE = 16;

export const categoryProductsQueryKey = (categoryValue) => ["categoryProducts", categoryValue];

async function fetchCategoryProducts(categoryValue) {
  const data = await productFunctions.getProductsByCategory(categoryValue);
  return Array.isArray(data?.products) ? data.products : [];
}

export function useCategoryProducts(categoryValue) {
  const {
    data: products = [],
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: categoryProductsQueryKey(categoryValue),
    queryFn: () => fetchCategoryProducts(categoryValue),
    enabled: Boolean(categoryValue),
    staleTime: 60 * 1000,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState([0, 999999999]);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.productName || p.product_name || "").toLowerCase().includes(term) ||
          (p.description || "").toLowerCase().includes(term)
      );
    }

    filtered = filtered.filter((p) => {
      const price = parseFloat(p.price || 0);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (ratingFilter !== "all") {
      const minRating = parseFloat(ratingFilter, 10);
      filtered = filtered.filter((p) => {
        const r = p.rating ?? p.product_rating;
        if (r == null || r === "") return true;
        return parseFloat(r, 10) >= minRating;
      });
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      if (sortBy === "oldest") return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      if (sortBy === "price-low") return parseFloat(a.price || 0) - parseFloat(b.price || 0);
      if (sortBy === "price-high") return parseFloat(b.price || 0) - parseFloat(a.price || 0);
      return 0;
    });

    return filtered;
  }, [products, searchTerm, priceRange, ratingFilter, sortBy]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const setPage = (p) => setCurrentPage(p);

  if (isError && error) {
    console.error("Error fetching category products:", error);
  }

  return {
    products: filteredProducts,
    paginatedProducts,
    loading,
    searchTerm,
    setSearchTerm,
    priceRange,
    setPriceRange,
    ratingFilter,
    setRatingFilter,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage: setPage,
    totalPages,
    itemsPerPage: ITEMS_PER_PAGE,
  };
}
