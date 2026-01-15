"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import Image from "next/image";
import ProductImage from "../components/ProductImage";
import Navbar from "../components/navbar";
import SearchBar from "../components/searchbar";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Header from "../components/header";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { formatPrice } from "@/lib/formatPrice";
import { productFunctions, cartFunctions } from "@/lib/supabase/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlus, 
  faMinus, 
  faTh, 
  faList, 
  faSearch, 
  faEye, 
  faTimes, 
  faAlignLeft, 
  faShoppingCart, 
  faCheckCircle, 
  faTag, 
  faCalculator, 
  faSpinner, 
  faCartPlus 
} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const router = useRouter();
  const { username } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useLoadingFavicon(loading, "Dashboard");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productFunctions.getProducts();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (err) {
        // Failed to fetch products
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY || document.documentElement.scrollTop;
          setIsScrolled(scrollPosition > 50);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = useCallback((searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(
      (product) =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products]);

  const handleView = useCallback((product) => {
    setSelectedProduct(product);
    setPopupVisible(true);
    setQuantity(1);
  }, []);

  const increaseQuantity = useCallback(() => {
    setQuantity((prev) => prev + 1);
  }, []);

  const decreaseQuantity = useCallback(() => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  }, []);

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    if (!username) {
      setCartMessage("login");
      setTimeout(() => setCartMessage(""), 3000);
      return;
    }

    setAddingToCart(true);

    try {
      const data = await cartFunctions.addToCart({
        username,
        productId: selectedProduct.product_id || selectedProduct.productId,
        productName: selectedProduct.product_name || selectedProduct.productName,
        description: selectedProduct.description,
        price: selectedProduct.price,
        idUrl: selectedProduct.id_url || selectedProduct.idUrl,
        quantity: quantity,
      });

      if (data.success) {
        setCartMessage("success");
        window.dispatchEvent(new Event("cartUpdated"));
        setTimeout(() => {
          setCartMessage("");
          closePopup();
        }, 2000);
      } else if (data.message && data.message.includes('already in cart')) {
        setCartMessage("exists");
        setTimeout(() => setCartMessage(""), 3000);
      } else {
        setCartMessage("error");
        setTimeout(() => setCartMessage(""), 3000);
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
  };

  const closePopup = () => {
    setPopupVisible(false);
    setSelectedProduct(null);
    setCartMessage("");
    setQuantity(1);
  };

  const calculateTotalPrice = useMemo(() => {
    if (!selectedProduct) return "0.00";
    return (parseFloat(selectedProduct.price) * quantity).toFixed(2);
  }, [selectedProduct, quantity]);

  // Memoize product card component
  const ProductCard = memo(({ product, onView }) => (
    <div
      key={product.id || product._id || product.product_id}
      className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200 flex flex-col"
    >
      <div className="relative h-56 overflow-hidden flex-shrink-0">
        <ProductImage
          src={product.id_url}
          alt={product.product_name}
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1536px) 25vw, 20vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
            <FontAwesomeIcon icon={faEye} className="text-red-600 text-base" />
          </div>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-900 truncate mb-2 group-hover:text-red-600 transition-colors">
            {product.product_name}
          </h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Price</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                ₱{formatPrice(product.price)}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => onView(product)}
          className="cursor-pointer w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 sm:py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base mt-auto"
        >
          <FontAwesomeIcon icon={faEye} className="text-base" />
          View Details
        </button>
      </div>
    </div>
  ));
  
  ProductCard.displayName = 'ProductCard';

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -left-20 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-40 -right-20 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <Navbar />

      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col">
        <div className="z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <Header />
            {!isScrolled && (
              <div className="pb-4 pt-3 flex justify-center">
                <div className="w-full max-w-2xl">
                  <SearchBar
                    placeholder="Search products..."
                    onSearch={handleSearch}
                    className="w-full mx-auto"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {isScrolled && (
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="px-4 sm:px-6 lg:px-8 py-3 flex justify-center">
              <div className="w-full max-w-2xl">
                <SearchBar
                  placeholder="Search products..."
                  onSearch={handleSearch}
                  className="w-full mx-auto"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="h-20 w-20 border-4 border-red-200 rounded-full mx-auto"></div>
                  <div className="h-20 w-20 border-4 border-t-red-600 rounded-full animate-spin absolute top-0 left-1/2 -translate-x-1/2"></div>
                </div>
                <p className="text-gray-700 font-semibold text-lg">
                  Loading Products...
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Please wait a moment
                </p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md border border-gray-100">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FontAwesomeIcon icon={faSearch} className="text-5xl text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {products.length === 0
                    ? "No Products Available"
                    : "No Results Found"}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {products.length === 0
                    ? "Check back later for new products."
                    : "We couldn't find any products matching your search. Try different keywords."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-bold text-red-600 text-lg">
                        {filteredProducts.length}
                      </span>
                      <span className="ml-2 text-gray-500">
                        {filteredProducts.length === 1 ? "Product" : "Products"}{" "}
                        Available
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`cursor-pointer px-3 sm:px-4 py-2 rounded-lg transition-all touch-manipulation text-sm sm:text-base ${
                      viewMode === "grid"
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <FontAwesomeIcon icon={faTh} className="mr-1 sm:mr-2 text-sm sm:text-base" />
                    <span className="hidden xs:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`cursor-pointer px-3 sm:px-4 py-2 rounded-lg transition-all touch-manipulation text-sm sm:text-base ${
                      viewMode === "list"
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <FontAwesomeIcon icon={faList} className="mr-1 sm:mr-2 text-sm sm:text-base" />
                    <span className="hidden xs:inline">List</span>
                  </button>
                </div>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id || product._id || product.product_id}
                      product={product}
                      onView={handleView}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id || product._id || product.product_id}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200 flex flex-col sm:flex-row"
                    >
                      <div className="relative w-full sm:w-48 h-48 overflow-hidden flex-shrink-0">
                        <ProductImage
                          src={product.id_url}
                          alt={product.product_name}
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, 192px"
                        />
                      </div>
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                            {product.product_name}
                          </h2>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Price</p>
                            <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                              ₱{formatPrice(product.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleView(product)}
                            className="cursor-pointer px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 touch-manipulation text-sm sm:text-base whitespace-nowrap"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-base" />
                            <span className="hidden sm:inline">View Details</span>
                            <span className="sm:hidden">View</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {popupVisible && selectedProduct && (
          <div 
            className="fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm z-50 p-2 sm:p-4 animate-in fade-in duration-200"
            onClick={closePopup}
          >
            <div 
              className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-[95%] sm:max-w-md md:max-w-xl transform transition-all duration-300 animate-in zoom-in-95 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <div className="relative w-full h-48 sm:h-72 md:h-96">
                  <ProductImage
                    src={selectedProduct.id_url}
                    alt={selectedProduct.product_name}
                    className="object-cover rounded-t-xl sm:rounded-t-2xl"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, 672px"
                    priority
                  />
                </div>
                <button
                  onClick={closePopup}
                  className="cursor-pointer absolute top-4 right-4 bg-white/95 hover:bg-white text-gray-800 rounded-full w-12 h-12 flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 backdrop-blur-sm"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 sm:p-6 md:p-8">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-2xl">
                    {selectedProduct.product_name}
                  </h2>
                </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                    <FontAwesomeIcon icon={faAlignLeft} className="mr-1.5 sm:mr-2 text-xs sm:text-sm" />
                    Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                    {selectedProduct.description || "No description available"}
                  </p>
                </div>

                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 flex items-center">
                    <FontAwesomeIcon icon={faShoppingCart} className="mr-1.5 sm:mr-2 text-xs sm:text-sm" />
                    Quantity
                  </h3>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-2">
                      <button
                        onClick={decreaseQuantity}
                        className="cursor-pointer w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center bg-white rounded-lg hover:bg-red-50 hover:text-red-600 transition-all shadow-sm touch-manipulation"
                      >
                        <FontAwesomeIcon icon={faMinus} className="text-base" />
                      </button>
                      <span className="w-20 sm:w-16 text-center font-bold text-gray-800 text-xl sm:text-lg">
                        {quantity}
                      </span>
                      <button
                        onClick={increaseQuantity}
                        className="cursor-pointer w-12 h-12 sm:w-10 sm:h-10 flex items-center justify-center bg-white rounded-lg hover:bg-green-50 hover:text-green-600 transition-all shadow-sm touch-manipulation"
                      >
                        <FontAwesomeIcon icon={faPlus} className="text-base" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">
                        Available in stock
                      </p>
                      <p className="text-sm text-green-600 font-semibold">
                        <FontAwesomeIcon icon={faCheckCircle} className="mr-1 text-sm" />
                        Ready to ship
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 border border-red-100 overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 md:gap-4 mb-2 sm:mb-3 min-w-0">
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium flex items-center">
                        <FontAwesomeIcon icon={faTag} className="mr-1 sm:mr-2 text-xs sm:text-sm flex-shrink-0" />
                        <span className="whitespace-nowrap">Unit Price</span>
                      </p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 break-words overflow-wrap-anywhere">
                        ₱{formatPrice(selectedProduct.price)}
                      </p>
                    </div>
                    <div className="text-center px-2 sm:px-4 flex-shrink-0">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium">
                        ×
                      </p>
                      <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                        {quantity}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-1 min-w-0 w-full sm:w-auto">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium flex items-center sm:justify-end">
                        <FontAwesomeIcon icon={faCalculator} className="mr-1 sm:mr-2 text-xs sm:text-sm flex-shrink-0" />
                        <span className="whitespace-nowrap">Total</span>
                      </p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent break-words overflow-wrap-anywhere">
                        ₱{calculateTotalPrice}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={cartMessage !== "" || addingToCart}
                  className="cursor-pointer w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation"
                >
                      {addingToCart ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="text-lg sm:text-xl animate-spin" />
                      <span className="text-sm sm:text-base">Adding to Cart...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCartPlus} className="text-lg sm:text-xl" />
                      <span className="text-sm sm:text-base">Add Item to Cart</span>
                    </>
                  )}
                </button>

                {cartMessage && (
                  <div className="mt-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <div
                      className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                        cartMessage === "success"
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                          : cartMessage === "exists"
                          ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                          : cartMessage === "login"
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                          : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                      }`}
                    >
                      <i
                        className={`fas ${
                          cartMessage === "success"
                            ? "fa-check-circle"
                            : cartMessage === "exists"
                            ? "fa-info-circle"
                            : cartMessage === "login"
                            ? "fa-user-lock"
                            : "fa-exclamation-circle"
                        } text-2xl`}
                      ></i>
                      <span>
                        {cartMessage === "success" &&
                          `${quantity} ${
                            quantity === 1 ? "item" : "items"
                          } added to cart successfully!`}
                        {cartMessage === "exists" &&
                          "Product quantity updated in your cart!"}
                        {cartMessage === "login" &&
                          "Please log in to add items to your cart."}
                        {cartMessage === "error" &&
                          "Failed to add product. Please try again."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
