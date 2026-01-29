"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import ProductImage from "./ProductImage";
import UserSidebar from "./UserSidebar";
import Pagination from "./Pagination";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { formatPrice } from "@/lib/formatPrice";
import { productFunctions, cartFunctions } from "@/lib/supabase/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faHeart,
  faShoppingCart,
  faChevronDown,
  faFilter,
  faArrowUp,
  faArrowDown,
  faChevronRight,
  faCheckCircle,
  faTimes,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import dynamic from "next/dynamic";

const ProductModal = dynamic(() => import("./ProductModal"), {
  loading: () => null,
  ssr: false
});

export default function CategoryPage({
  categoryName,
  categoryIcon,
  categoryValue,
}) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;
  const router = useRouter();
  const { username } = useAuth();

  useLoadingFavicon(loading, categoryName);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `/api/getProductByCategory?category=${categoryValue}`
        );
        const data = await res.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryValue]);

  useEffect(() => {
    let filtered = products;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (product) =>
          product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((product) => product.category === categoryFilter);
    }

    // Price range filter
    filtered = filtered.filter((product) => {
      const price = parseFloat(product.price || 0);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      } else if (sortBy === "oldest") {
        return new Date(a.created_at || 0) - new Date(b.created_at || 0);
      } else if (sortBy === "price-low") {
        return parseFloat(a.price || 0) - parseFloat(b.price || 0);
      } else if (sortBy === "price-high") {
        return parseFloat(b.price || 0) - parseFloat(a.price || 0);
      }
      return 0;
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [products, searchTerm, categoryFilter, priceRange, ratingFilter, sortBy]);

  const handleView = useCallback((product) => {
    setSelectedProduct(product);
    setPopupVisible(true);
  }, []);

  const closePopup = useCallback(() => {
    setPopupVisible(false);
    setSelectedProduct(null);
    setCartMessage("");
    setQuantity(1);
  }, []);

  const handleAddToCart = useCallback(async (product, qty = quantity) => {
    if (!product) return;

    if (!username) {
      setCartMessage("login");
      setTimeout(() => setCartMessage(""), 3000);
      return;
    }

    setAddingToCart(true);
    setSelectedProduct(product);

    try {
      const data = await cartFunctions.addToCart({
        username,
        productId: product.product_id || product.productId,
        productName: product.product_name || product.productName,
        description: product.description,
        price: product.price,
        idUrl: product.id_url || product.idUrl,
        quantity: qty,
      });

      // Success if: cartItem exists (new item), updated exists (quantity updated), or message contains success/updated
      if (data.cartItem || data.updated || (data.message && (data.message.includes('successfully') || data.message.includes('updated')))) {
        setCartMessage("success");
        window.dispatchEvent(new Event("cartUpdated"));
        setTimeout(() => {
          setCartMessage("");
          closePopup();
        }, 2000);
      } else if (data.message && (data.message.includes('already in cart') || data.message.includes('already in'))) {
        setCartMessage("exists");
        setTimeout(() => setCartMessage(""), 3000);
      } else if (data.success === false) {
        setCartMessage("error");
        setTimeout(() => setCartMessage(""), 3000);
      } else {
        // Default to success if we got here without error
        setCartMessage("success");
        window.dispatchEvent(new Event("cartUpdated"));
        setTimeout(() => {
          setCartMessage("");
          closePopup();
        }, 2000);
      }
    } catch (err) {
      if (err.response && err.response.message && err.response.message.includes('already in cart')) {
        setCartMessage("exists");
      } else {
        setCartMessage("error");
      }
      setTimeout(() => setCartMessage(""), 3000);
    } finally {
      setAddingToCart(false);
    }
  }, [username, quantity, closePopup]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1a1a]">
      <UserSidebar />
      
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040] sticky top-0 z-30">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/dashboard")}>
                <span className="text-xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5]">Totally Normal</span>
                <span className="w-2 h-2 bg-[#FFBF00] rounded-full"></span>
                <span className="text-xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5]">Store</span>
              </div>
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <FontAwesomeIcon icon={faChevronRight} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#a3a3a3] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-[#E0E0E0] dark:border-[#404040] rounded-xl focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#666666] dark:placeholder-[#a3a3a3]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-[#2C2C2C] dark:text-[#e5e5e5] hover:text-[#FFBF00] transition-colors">New Arrivals</button>
                <button className="text-[#2C2C2C] dark:text-[#e5e5e5] hover:text-[#FFBF00] transition-colors">Best Sellers</button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <nav className="text-sm text-[#666666] dark:text-[#a3a3a3]">
              <span className="hover:text-[#FFBF00] cursor-pointer" onClick={() => router.push("/dashboard")}>Home</span>
              <span className="mx-2">/</span>
              <span className="text-[#2C2C2C] dark:text-[#e5e5e5] font-semibold">All Products</span>
            </nav>
          </div>

          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-2">Our Collection</h1>
            <p className="text-[#666666] dark:text-[#a3a3a3]">
              Discover a curated selection of premium products designed for your everyday needs.
            </p>
          </div>

          {/* Filters and Sort */}
          <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <button className="px-4 py-2.5 bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#404040] rounded-xl text-[#2C2C2C] dark:text-[#e5e5e5] font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors">
                Category
                <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
              </button>
              <button className="px-4 py-2.5 bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#404040] rounded-xl text-[#2C2C2C] dark:text-[#e5e5e5] font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors">
                Price Range
                <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
              </button>
              <button className="px-4 py-2.5 bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#404040] rounded-xl text-[#2C2C2C] dark:text-[#e5e5e5] font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors">
                Rating
                <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
              </button>
              <button className="px-4 py-2.5 bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#404040] rounded-xl text-[#2C2C2C] dark:text-[#e5e5e5] font-semibold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors">
                Sort By: {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : sortBy === "price-low" ? "Price: Low to High" : "Price: High to Low"}
                <FontAwesomeIcon icon={sortBy.includes("price-low") ? faArrowUp : faArrowDown} className="text-xs" />
              </button>
            </div>
            <p className="text-sm text-[#666666] dark:text-[#a3a3a3]">
              Showing <span className="font-semibold text-[#2C2C2C] dark:text-[#e5e5e5]">{filteredProducts.length}</span> products
            </p>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-md border border-[#E0E0E0] dark:border-[#404040] animate-pulse">
                  <div className="h-64 bg-[#E0E0E0] dark:bg-[#404040]"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-[#E0E0E0] dark:bg-[#404040] rounded w-3/4"></div>
                    <div className="h-6 bg-[#E0E0E0] dark:bg-[#404040] rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-[#2C2C2C] rounded-xl shadow-md border border-[#E0E0E0] dark:border-[#404040] p-12 text-center">
              <p className="text-[#666666] dark:text-[#a3a3a3] text-lg font-semibold mb-2">No products found</p>
              <p className="text-[#666666] dark:text-[#a3a3a3] text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {paginatedProducts.map((product) => (
                  <div
                    key={product.id || product.product_id}
                    className="group bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-[#E0E0E0] dark:border-[#404040] relative"
                  >
                    {/* Badges */}
                    <div className="absolute top-3 left-3 z-10">
                      {product.stock_quantity > 0 && product.is_available && (
                        <span className="px-2 py-1 bg-[#FFBF00] text-[#2C2C2C] text-xs font-bold rounded">NEW</span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <button className="w-8 h-8 bg-white dark:bg-[#404040] rounded-full flex items-center justify-center shadow-md hover:bg-[#E0E0E0] dark:hover:bg-[#505050] transition-colors opacity-0 group-hover:opacity-100 border border-[#E0E0E0] dark:border-[#404040]">
                        <FontAwesomeIcon icon={faHeart} className="text-[#FFBF00] text-sm" />
                      </button>
                    </div>

                    {/* Product Image */}
                    <div className="relative h-64 overflow-hidden bg-white dark:bg-white/5">
                      <ProductImage
                        src={product.idUrl || product.id_url}
                        alt={product.productName || product.product_name}
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => handleView(product)}
                          className="bg-white dark:bg-[#404040] rounded-full p-3 shadow-lg hover:scale-110 transition-transform"
                        >
                          <FontAwesomeIcon icon={faEye} className="text-[#FFBF00] text-lg" />
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <p className="text-xs font-bold text-[#666666] dark:text-[#a3a3a3] uppercase mb-1">ACCESSORIES</p>
                      <h3 className="font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-2 line-clamp-1 group-hover:text-[#FFBF00] transition-colors">
                        {product.productName || product.product_name}
                      </h3>
                      <p className="text-lg font-bold text-[#FFBF00] mb-4">
                        ₱{formatPrice(product.price)}
                      </p>
                      <button
                        onClick={() => handleView(product)}
                        className="w-full bg-[#FFBF00] hover:bg-[#e6ac00] text-[#2C2C2C] py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <FontAwesomeIcon icon={faShoppingCart} className="text-sm" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
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
      </main>

      {/* Product Modal */}
      {popupVisible && selectedProduct && (
        <ProductModal
          product={{
            ...selectedProduct,
            productName: selectedProduct.productName || selectedProduct.product_name,
            idUrl: selectedProduct.idUrl || selectedProduct.id_url,
            sellerUsername: selectedProduct.sellerUsername || selectedProduct.seller_username
          }}
          onClose={closePopup}
          onAddToCart={handleAddToCart}
          isAddingToCart={addingToCart}
          username={username}
          initialQuantity={quantity}
        />
      )}

      {/* Cart Success Popup */}
      {cartMessage && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-2 fade-in ${
          cartMessage === "success" ? "bg-[#4CAF50]" : 
          cartMessage === "exists" ? "bg-[#FFBF00]" : 
          cartMessage === "login" ? "bg-[#2F79F4]" : 
          "bg-[#F44336]"
        } text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-2xl flex items-start gap-3`}>
          {cartMessage === "success" && <FontAwesomeIcon icon={faCheckCircle} className="text-lg flex-shrink-0 mt-0.5" />}
          {cartMessage === "exists" && <FontAwesomeIcon icon={faExclamationTriangle} className="text-lg flex-shrink-0 mt-0.5" />}
          {cartMessage === "error" && <FontAwesomeIcon icon={faTimes} className="text-lg flex-shrink-0 mt-0.5" />}
          {cartMessage === "login" && <FontAwesomeIcon icon={faExclamationTriangle} className="text-lg flex-shrink-0 mt-0.5" />}
          <p className="font-medium text-sm sm:text-base break-words flex-1">
            {cartMessage === "success" && "Product added to cart successfully!"}
            {cartMessage === "exists" && "This product is already in your cart"}
            {cartMessage === "error" && "Failed to add product to cart"}
            {cartMessage === "login" && "Please sign in to add items to cart"}
          </p>
          <button onClick={() => setCartMessage("")} className="text-white/80 hover:text-white">
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
          </button>
        </div>
      )}
    </div>
  );
}
