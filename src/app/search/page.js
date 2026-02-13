"use client";

import { useEffect, useState, useMemo, useCallback, Suspense, useRef } from "react";
import ProductImage from "@/app/components/ProductImage";
import Pagination from "@/app/components/Pagination";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useSidebar } from "@/app/context/SidebarContext";
import ThemeToggle from "@/app/components/ThemeToggle";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { formatPrice } from "@/lib/formatPrice";
import { productFunctions, cartFunctions } from "@/lib/supabase/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faEye, faHeart, faShoppingCart, faBars } from "@fortawesome/free-solid-svg-icons";
import dynamic from "next/dynamic";

const ProductModal = dynamic(() => import("@/app/components/ProductModal"), { loading: () => null, ssr: false });

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localQuery, setLocalQuery] = useState(q);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;
  const { username } = useAuth();
  const { setSidebarOpen } = useSidebar();
  const debounceTimerRef = useRef(null);

  useLoadingFavicon(loading, "Search");

  useEffect(() => {
    setLocalQuery(q);
    setCurrentPage(1);
  }, [q]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productFunctions.getProducts();
        setProducts(data.products || []);
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Update URL with debouncing when localQuery changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const trimmedQuery = localQuery.trim();
      if (trimmedQuery !== q) {
        router.push(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : "/search");
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [localQuery, q, router]);

  const filteredProducts = useMemo(() => {
    if (!localQuery.trim()) return products || [];
    const term = localQuery.toLowerCase().trim();
    return (products || []).filter(
      (p) =>
        (p.product_name || p.productName || "").toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term)
    );
  }, [products, localQuery]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleSearchChange = (value) => {
    setLocalQuery(value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleView = useCallback((product) => {
    setSelectedProduct(product);
    setPopupVisible(true);
  }, []);

  const closePopup = useCallback(() => {
    setPopupVisible(false);
    setSelectedProduct(null);
  }, []);

  return (
    <>
        <header className="bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040] sticky top-0 z-30">
          <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="md:hidden p-2 sm:p-2.5 bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#404040] rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors flex-shrink-0"
                    aria-label="Open menu"
                  >
                    <FontAwesomeIcon icon={faBars} className="text-[#2C2C2C] dark:text-white text-base sm:text-lg" />
                  </button>
                  <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer flex-shrink-0 min-w-0" onClick={() => router.push("/dashboard")}>
                    <span className="text-base sm:text-lg md:text-xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] whitespace-nowrap">Totally Normal</span>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#FFBF00] rounded-full flex-shrink-0" />
                    <span className="text-base sm:text-lg md:text-xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] whitespace-nowrap">Store</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <ThemeToggle />
                </div>
              </div>
              <div className="flex-1 w-full sm:max-w-2xl min-w-0">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#a3a3a3] text-sm sm:text-base" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={localQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base bg-white dark:bg-[#1a1a1a] border border-[#E0E0E0] dark:border-[#404040] rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#666666] dark:placeholder-[#a3a3a3]"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8">
          {!localQuery.trim() && (
            <div className="mb-3 sm:mb-4">
              <nav className="text-xs sm:text-sm text-[#666666] dark:text-[#a3a3a3]">
                <span className="hover:text-[#FFBF00] cursor-pointer" onClick={() => router.push("/dashboard")}>Home</span>
                <span className="mx-1 sm:mx-2">/</span>
                <span className="text-[#2C2C2C] dark:text-[#e5e5e5] font-semibold">All Products</span>
              </nav>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#2C2C2C] rounded-2xl border border-[#E0E0E0] dark:border-[#404040] animate-pulse">
                  <div className="h-64 bg-[#E0E0E0] dark:bg-[#404040]" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-[#E0E0E0] dark:bg-[#404040] rounded w-3/4" />
                    <div className="h-6 bg-[#E0E0E0] dark:bg-[#404040] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-[#2C2C2C] rounded-xl border border-[#E0E0E0] dark:border-[#404040] p-6 sm:p-8 md:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-50 dark:bg-[#404040] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FontAwesomeIcon icon={faSearch} className="text-2xl sm:text-3xl text-[#666666] dark:text-[#a3a3a3]" />
              </div>
              <p className="text-sm sm:text-base text-[#666666] dark:text-[#a3a3a3] font-medium">No products match &quot;{localQuery.trim()}&quot;</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-[#FFBF00] hover:bg-[#e6ac00] text-white rounded-lg sm:rounded-xl font-semibold"
              >
                Browse all products
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {paginated.map((p) => (
                  <div
                    key={p.product_id || p.productId || p.id}
                    className="bg-white dark:bg-[#2C2C2C] rounded-2xl border border-[#E0E0E0] dark:border-[#404040] overflow-hidden shadow-sm hover:shadow-lg transition-all group"
                  >
                    <div className="relative h-64 overflow-hidden bg-white dark:bg-white/5">
                      <ProductImage
                        src={p.id_url || p.idUrl}
                        alt={p.product_name || p.productName}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                      />
                      <button
                        type="button"
                        className="absolute top-3 right-3 w-8 h-8 bg-white dark:bg-[#404040] rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition border border-[#E0E0E0] dark:border-[#404040]"
                        aria-label="Wishlist"
                      >
                        <FontAwesomeIcon icon={faHeart} className="text-[#FFBF00] text-sm" />
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-bold text-[#666666] dark:text-[#a3a3a3] uppercase mb-1">Product</p>
                      <h3 className="font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-2 line-clamp-1 group-hover:text-[#FFBF00]">
                        {p.product_name || p.productName}
                      </h3>
                      <p className="text-lg font-bold text-[#FFBF00] mb-4">₱{formatPrice(p.price)}</p>
                      <button
                        onClick={() => handleView(p)}
                        className="w-full py-2.5 bg-[#FFBF00] hover:bg-[#e6ac00] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        <FontAwesomeIcon icon={faShoppingCart} />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredProducts.length}
                />
              )}
            </>
          )}
        </div>

        {popupVisible && selectedProduct && (
          <ProductModal
            product={{
              ...selectedProduct,
              productName: selectedProduct.product_name || selectedProduct.productName,
              idUrl: selectedProduct.id_url || selectedProduct.idUrl,
              sellerUsername: selectedProduct.seller_username || selectedProduct.sellerUsername,
            }}
            onClose={closePopup}
            onAddToCart={(prod, qty) => {
              if (username) cartFunctions.addToCart({ username, productId: prod.product_id || prod.productId, productName: prod.product_name || prod.productName, description: prod.description, price: prod.price, idUrl: prod.id_url || prod.idUrl, quantity: qty }).then(() => window.dispatchEvent(new Event("cartUpdated")));
            }}
            isAddingToCart={false}
            username={username}
            initialQuantity={1}
          />
        )}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#1a1a1a]">
          <div className="h-12 w-12 border-4 border-t-transparent border-[#FFBF00] rounded-full loading-spinner-animated" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
