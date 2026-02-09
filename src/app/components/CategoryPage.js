"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import Pagination from "./Pagination";
import CartToast from "./CartToast";
import CategoryFilters from "./category/CategoryFilters";
import CategoryProductCard from "./category/CategoryProductCard";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { useCategoryProducts } from "@/app/hooks/useCategoryProducts";
import { useAddToCartToast } from "@/app/hooks/useAddToCartToast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import dynamic from "next/dynamic";

const ProductModal = dynamic(() => import("./ProductModal"), {
  loading: () => null,
  ssr: false,
});

export default function CategoryPage({ categoryName, categoryValue }) {
  const router = useRouter();
  const { username } = useAuth();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const {
    products,
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
    setCurrentPage,
    totalPages,
    itemsPerPage,
  } = useCategoryProducts(categoryValue);

  const closePopup = useCallback(() => {
    setPopupVisible(false);
    setSelectedProduct(null);
    setQuantity(1);
  }, []);

  const { handleAddToCart, addingToCart, cartMessage, setCartMessage } = useAddToCartToast(username, closePopup);

  useLoadingFavicon(loading, categoryName);

  const handleView = useCallback((product) => {
    setSelectedProduct(product);
    setPopupVisible(true);
    setQuantity(1);
  }, []);

  return (
    <>
      <header className="bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040] sticky top-0 z-30">
        <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div
                className="flex items-center gap-1.5 sm:gap-2 cursor-pointer flex-shrink-0"
                onClick={() => router.push("/dashboard")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && router.push("/dashboard")}
              >
                <span className="text-base sm:text-lg md:text-xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] whitespace-nowrap">Totally Normal</span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#FFBF00] rounded-full flex-shrink-0" />
                <span className="text-base sm:text-lg md:text-xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] whitespace-nowrap">Store</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
                <div className="hidden sm:flex items-center gap-2 sm:gap-3 md:gap-4">
                  <button type="button" className="text-sm sm:text-base text-[#2C2C2C] dark:text-[#e5e5e5] hover:text-[#FFBF00] transition-colors whitespace-nowrap">
                    New Arrivals
                  </button>
                  <button type="button" className="text-sm sm:text-base text-[#2C2C2C] dark:text-[#e5e5e5] hover:text-[#FFBF00] transition-colors whitespace-nowrap">
                    Best Sellers
                  </button>
                </div>
                <ThemeToggle />
              </div>
            </div>
            <div className="flex-1 w-full sm:max-w-2xl min-w-0">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#a3a3a3] pointer-events-none text-sm sm:text-base"
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base bg-white dark:bg-[#1a1a1a] border border-[#E0E0E0] dark:border-[#404040] rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#666666] dark:placeholder-[#a3a3a3]"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 md:p-8">
        <nav className="mb-3 sm:mb-4 text-xs sm:text-sm text-[#666666] dark:text-[#a3a3a3] flex items-center flex-wrap gap-x-1">
          <span className="hover:text-[#FFBF00] cursor-pointer" onClick={() => router.push("/")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && router.push("/")}>Home</span>
          <span className="mx-0.5">/</span>
          <span className="hover:text-[#FFBF00] cursor-pointer" onClick={() => router.push("/")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && router.push("/")}>All Products</span>
          <span className="mx-0.5">/</span>
          <span className="text-[#2C2C2C] dark:text-[#e5e5e5] font-semibold">{categoryName}</span>
        </nav>

        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-1 sm:mb-2">Our Collection</h1>
          <p className="text-sm sm:text-base text-[#666666] dark:text-[#a3a3a3]">
            Discover a curated selection of premium products designed for your everyday needs.
          </p>
        </div>

        <CategoryFilters
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          ratingFilter={ratingFilter}
          setRatingFilter={setRatingFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          productCount={products.length}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-md border border-[#E0E0E0] dark:border-[#404040] animate-pulse"
              >
                <div className="h-64 bg-[#E0E0E0] dark:bg-[#404040]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#E0E0E0] dark:bg-[#404040] rounded w-3/4" />
                  <div className="h-6 bg-[#E0E0E0] dark:bg-[#404040] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white dark:bg-[#2C2C2C] rounded-xl shadow-md border border-[#E0E0E0] dark:border-[#404040] p-6 sm:p-8 md:p-12 text-center">
            <p className="text-[#666666] dark:text-[#a3a3a3] text-base sm:text-lg font-semibold mb-2">No products found</p>
            <p className="text-[#666666] dark:text-[#a3a3a3] text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {paginatedProducts.map((product) => (
                <CategoryProductCard
                  key={product.id || product.product_id}
                  product={product}
                  onView={handleView}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={products.length}
              />
            )}
          </>
        )}
      </div>

      {popupVisible && selectedProduct && (
        <ProductModal
          product={{
            ...selectedProduct,
            productName: selectedProduct.productName || selectedProduct.product_name,
            idUrl: selectedProduct.idUrl || selectedProduct.id_url,
            sellerUsername: selectedProduct.sellerUsername || selectedProduct.seller_username,
          }}
          onClose={closePopup}
          onAddToCart={handleAddToCart}
          isAddingToCart={addingToCart}
          username={username}
          initialQuantity={quantity}
        />
      )}

      <CartToast message={cartMessage} onDismiss={() => setCartMessage("")} />
    </>
  );
}
