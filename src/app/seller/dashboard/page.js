"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import dynamic from "next/dynamic";
import SearchBar from "@/app/components/searchbar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { formatPrice } from "@/lib/formatPrice";
import { productFunctions, cartFunctions } from "@/lib/supabase/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTh, 
  faList, 
  faSearch,
  faEye
} from "@fortawesome/free-solid-svg-icons";
import Header from "@/app/components/header";
import Navbar from "../components/sellerNavbar";
import { ProductGridSkeleton } from "@/app/components/ProductSkeleton";

// Lazy load components
const ProductCard = dynamic(() => import("@/app/components/ProductCard"), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-2xl h-96" />,
  ssr: false
});

const ProductModal = dynamic(() => import("@/app/components/ProductModal"), {
  loading: () => null,
  ssr: false
});

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
  const { username, role, loading: authLoading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useLoadingFavicon(authLoading || loading, "Seller Dashboard");

  useEffect(() => {

    if (authLoading) {
      return;
    }

    if (role && role !== "seller" && role !== "admin") {
      router.push("/");
      return;
    }

    if (!role) {
      router.push("/");
      return;
    }
  }, [username, role, authLoading, router]);

  useEffect(() => {
    if (authLoading) {
      return; 
    }
    if (!username || (role !== "seller" && role !== "admin")) {
      return;
    }
    const fetchProducts = async () => {
      try {
        const data = await productFunctions.getProducts();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (err) {

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

  const handleSearch = (searchTerm) => {
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
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setPopupVisible(true);
    setQuantity(1);
  };

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

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
      setCartMessage("error");
      setTimeout(() => setCartMessage(""), 3000);
    } finally {
      setAddingToCart(false);
    }
  }, [username, quantity]);

  const closePopup = () => {
    setPopupVisible(false);
    setSelectedProduct(null);
    setCartMessage("");
    setQuantity(1);
  };

  const calculateTotalPrice = () => {
    if (!selectedProduct) return "0.00";
    return (parseFloat(selectedProduct.price) * quantity).toFixed(2);
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1a1a]">
      <Navbar />

      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col">
        <div className="z-20 bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040] shadow-sm">
          <div className="px-4 sm:px-5 lg:px-6 pt-3 sm:pt-4">
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
          <div className="sticky top-0 z-30 bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040] shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">
            <div className="px-4 sm:px-5 lg:px-6 py-2.5 flex justify-center">
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

        <div className="flex-1 overflow-auto px-4 sm:px-5 lg:px-6 py-5 sm:py-6">
          {loading ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="h-10 w-48 bg-[#E0E0E0] dark:bg-[#404040] rounded-xl animate-pulse" />
                <div className="h-10 w-32 bg-[#E0E0E0] dark:bg-[#404040] rounded-xl animate-pulse" />
              </div>
              <Suspense fallback={<ProductGridSkeleton count={12} />}>
                <ProductGridSkeleton count={12} />
              </Suspense>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 max-w-md border border-gray-100">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FontAwesomeIcon icon={faSearch} className="text-5xl text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {products.length === 0 ? "No Products Available" : "No Results Found"}
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
                  <div className="bg-white dark:bg-[#2C2C2C] px-4 py-2 rounded-xl shadow-sm border border-[#E0E0E0] dark:border-[#404040]">
                    <p className="text-sm text-[#666666] dark:text-[#a3a3a3]">
                      <span className="font-bold text-[#FFBF00] text-lg">{filteredProducts.length}</span>
                      <span className="ml-2">
                        {filteredProducts.length === 1 ? "Product" : "Products"} Available
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-[#2C2C2C] rounded-xl shadow-sm border border-[#E0E0E0] dark:border-[#404040] p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`cursor-pointer px-3 sm:px-4 py-2 rounded-lg transition-all touch-manipulation text-sm sm:text-base ${
                      viewMode === "grid"
                        ? "bg-[#FFBF00] text-[#2C2C2C] shadow-md"
                        : "text-[#666666] dark:text-[#a3a3a3] hover:bg-[#E0E0E0] dark:hover:bg-[#404040]"
                    }`}
                  >
                    <FontAwesomeIcon icon={faTh} className="mr-1 sm:mr-2 text-sm sm:text-base" />
                    <span className="hidden xs:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`cursor-pointer px-3 sm:px-4 py-2 rounded-lg transition-all touch-manipulation text-sm sm:text-base ${
                      viewMode === "list"
                        ? "bg-[#FFBF00] text-[#2C2C2C] shadow-md"
                        : "text-[#666666] dark:text-[#a3a3a3] hover:bg-[#E0E0E0] dark:hover:bg-[#404040]"
                    }`}
                  >
                    <FontAwesomeIcon icon={faList} className="mr-1 sm:mr-2 text-sm sm:text-base" />
                    <span className="hidden xs:inline">List</span>
                  </button>
                </div>
              </div>

              {viewMode === "grid" ? (
                <Suspense fallback={<ProductGridSkeleton count={8} />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id || product._id || product.product_id}
                        product={{
                          ...product,
                          productName: product.product_name || product.productName,
                          idUrl: product.id_url || product.idUrl,
                          sellerUsername: product.seller_username || product.sellerUsername
                        }}
                        onView={handleView}
                        onAddToCart={handleAddToCart}
                        isAddingToCart={addingToCart && selectedProduct?.product_id === (product.product_id || product.productId)}
                      />
                    ))}
                  </div>
                </Suspense>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id || product._id || product.product_id}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200 flex flex-col sm:flex-row"
                    >
                      <div className="relative w-full sm:w-48 md:w-56 lg:w-64 h-48 sm:h-52 md:h-56 overflow-hidden flex-shrink-0">
                        <img
                          src={product.id_url}
                          alt={product.product_name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          style={{ minHeight: '100%', minWidth: '100%' }}
                        />
                      </div>
                      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                            {product.product_name}
                          </h2>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Price</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800">
                              ₱{formatPrice(product.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleView(product)}
                            className="cursor-pointer px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-base" />
                            View Details
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
          <Suspense fallback={null}>
            <ProductModal
              product={{
                ...selectedProduct,
                productName: selectedProduct.product_name || selectedProduct.productName,
                idUrl: selectedProduct.id_url || selectedProduct.idUrl,
                sellerUsername: selectedProduct.seller_username || selectedProduct.sellerUsername
              }}
              onClose={closePopup}
              onAddToCart={(product, qty) => handleAddToCart(product, qty)}
              isAddingToCart={addingToCart}
              username={username}
              initialQuantity={quantity}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}