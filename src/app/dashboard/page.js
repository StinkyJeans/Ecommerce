"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import SearchBar from "../components/searchbar";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import ThemeToggle from "../components/ThemeToggle";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { productFunctions, cartFunctions } from "@/lib/supabase/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faSearch,
  faEye,
  faHeart,
  faShoppingCart,
  faChevronRight,
  faArrowRight,
  faCheckCircle,
  faTimes,
  faExclamationTriangle,
  faBars
} from "@fortawesome/free-solid-svg-icons";
import { ProductGridSkeleton } from "../components/ProductSkeleton";
import { getShopCategories } from "@/lib/categories";

const ProductCard = dynamic(() => import("../components/ProductCard"), {
  loading: () => <div className="animate-pulse bg-[#E0E0E0] dark:bg-[#404040] rounded-2xl h-96" />,
  ssr: false
});

const ProductModal = dynamic(() => import("../components/ProductModal"), {
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
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();
  const { username } = useAuth();
  const { setSidebarOpen } = useSidebar();

  useLoadingFavicon(loading, "Totally Normal Store");

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!username) {
        setCartCount(0);
        return;
      }
      if (document.hidden) return;
      try {
        const data = await cartFunctions.getCartCount(username);
        setCartCount(Number(data?.count) ?? 0);
      } catch {
        setCartCount(0);
      }
    };
    fetchCartCount();
    const interval = setInterval(fetchCartCount, 30000);
    const onCartUpdate = () => fetchCartCount();
    const onVisibility = () => { if (!document.hidden) fetchCartCount(); };
    window.addEventListener("cartUpdated", onCartUpdate);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener("cartUpdated", onCartUpdate);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [username]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productFunctions.getProducts();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSearch = useCallback((searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(
      (product) =>
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products]);

  const handleView = useCallback((product) => {
    setSelectedProduct(product);
    setPopupVisible(true);
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
  }, [username, quantity]);

  const closePopup = () => {
    setPopupVisible(false);
    setSelectedProduct(null);
    setCartMessage("");
    setQuantity(1);
  };

  const trendingProducts = useMemo(() => {
    return filteredProducts.slice(0, 4);
  }, [filteredProducts]);

  const newArrivals = useMemo(() => {
    return filteredProducts.slice(4, 8);
  }, [filteredProducts]);

  return (
        <>
              <header className="bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040] sticky top-0 z-20">
          <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex-1 flex items-center min-w-0">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 sm:p-2.5 bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#404040] rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors flex-shrink-0"
                  aria-label="Open menu"
                >
                  <FontAwesomeIcon icon={faBars} className="text-[#2C2C2C] dark:text-white text-base sm:text-lg" />
                </button>
              </div>
              <div className="flex-1 flex justify-center min-w-0 max-w-2xl shrink-0">
                <SearchBar
                  placeholder="Search products..."
                  onSearch={handleSearch}
                  className="w-full"
                />
              </div>
              <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3 md:gap-4 min-w-0">
                <button className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors p-2">
                  <FontAwesomeIcon icon={faHeart} className="text-lg sm:text-xl" />
                </button>
                <button 
                  onClick={() => router.push("/cart/viewCart")}
                  className="relative text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors p-2"
                >
                  <FontAwesomeIcon icon={faShoppingCart} className="text-lg sm:text-xl" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-5 px-1 bg-orange-500 text-white rounded-full text-[10px] sm:text-xs flex items-center justify-center font-semibold">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8">
          {loading ? (
            <div className="space-y-8">
              <ProductGridSkeleton count={12} />
            </div>
          ) : (
            <>
              <div className="mb-8 sm:mb-10 md:mb-12 relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
                <div className="relative h-64 sm:h-80 md:h-96 bg-[#5C6F5A]">
                  <div className="relative h-full flex items-center px-4 sm:px-6 md:px-8 lg:px-12">
                    <div className="max-w-2xl">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
                        Quality Goods for <span className="text-[#FFBF00]">Totally Normal</span> People.
                      </h1>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-4 sm:mb-6">
                        Explore our curated collection of everyday essentials designed for comfort, utility, and understated style.
                      </p>
                      <button
                        onClick={() => router.push("/search")}
                        className="px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-[#FFBF00] hover:bg-[#e6ac00] text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        Shop All Products
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs sm:text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trending Now Section */}
              <div className="mb-8 sm:mb-10 md:mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-1 sm:mb-2">Trending Now</h2>
                    <p className="text-sm sm:text-base text-[#666666] dark:text-[#a3a3a3]">The items everyone is talking about this week.</p>
                  </div>
                  <button className="text-[#2C2C2C] dark:text-[#e5e5e5] hover:text-[#FFBF00] font-semibold flex items-center gap-2 text-sm sm:text-base self-start sm:self-auto">
                    View all
                    <FontAwesomeIcon icon={faChevronRight} className="text-xs sm:text-sm" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {trendingProducts.map((product) => (
                    <ProductCard
                      key={product.id || product.product_id}
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
              </div>

              <div className="mb-8 sm:mb-10 md:mb-12 hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {getShopCategories().map((cat) => (
                  <div
                    key={cat.value}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(cat.path)}
                    onKeyDown={(e) => e.key === "Enter" && router.push(cat.path)}
                    className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-lg h-48 sm:h-56 md:h-64 group cursor-pointer border border-[#E0E0E0] dark:border-[#404040]"
                  >
                    <div className="absolute inset-0 bg-[#5C6F5A]" />
                    <div className="relative h-full flex flex-col justify-end p-4 sm:p-5 md:p-6">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">{cat.label}</h3>
                      <p className="text-sm sm:text-base text-white/90">
                        {cat.value === "Pc" ? "Power and portability" : cat.value === "Mobile" ? "Phones and tablets" : "Time in style"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-8 sm:mb-10 md:mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-1 sm:mb-2">New Arrivals</h2>
                    <p className="text-sm sm:text-base text-[#666666] dark:text-[#a3a3a3]">Fresh items added to our store this week.</p>
                  </div>
                  <button className="text-[#2C2C2C] dark:text-[#e5e5e5] hover:text-[#FFBF00] font-semibold flex items-center gap-2 text-sm sm:text-base self-start sm:self-auto">
                    Shop New
                    <FontAwesomeIcon icon={faChevronRight} className="text-xs sm:text-sm" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {newArrivals.map((product) => (
                    <ProductCard
                      key={product.id || product.product_id}
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
              </div>

              <div className="hidden md:block bg-white dark:bg-[#2C2C2C] border border-[#E0E0E0] dark:border-[#404040] rounded-2xl shadow-md p-8 mb-12">
                <div className="max-w-2xl mx-auto text-center">
                  <h2 className="text-3xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-3">Stay in the Loop</h2>
                  <p className="text-[#666666] dark:text-[#a3a3a3] mb-6">
                    Sign up for our totally normal newsletter to get exclusive deals and early access to drops.
                  </p>
                  <div className="flex gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 border border-[#E0E0E0] dark:border-[#404040] rounded-xl focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none bg-white dark:bg-[#1a1a1a] text-[#2C2C2C] dark:text-[#e5e5e5]"
                    />
                    <button className="px-6 py-3 bg-[#FFBF00] hover:bg-[#e6ac00] text-white rounded-xl font-semibold transition-colors">
                      Join Now
                    </button>
                  </div>
                </div>
              </div>

              {/* All Products Section */}
              {filteredProducts.length > 8 && (
                <div>
                  <h2 className="text-3xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-6">Our Collection</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.slice(8).map((product) => (
                      <ProductCard
                        key={product.id || product.product_id}
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

      {cartMessage && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-2 fade-in ${
          cartMessage === "success" ? "bg-[#4CAF50]" : 
          cartMessage === "exists" ? "bg-[#FFBF00]" : 
          cartMessage === "login" ? "bg-[#e6ac00]" : 
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
            {cartMessage === "login" && "Please Login to add this product to your cart."}
          </p>
          <button onClick={() => setCartMessage("")} className="text-white/80 hover:text-white">
            <FontAwesomeIcon icon={faTimes} className="text-sm" />
          </button>
        </div>
      )}
    </>
  );
}
