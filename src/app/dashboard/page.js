"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import SearchBar from "../components/searchbar";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Header from "../components/header";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/getProduct");
        const data = await res.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter((product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };


  const handleView = (product) => {
    setSelectedProduct(product);
    setPopupVisible(true);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    try {
      const res = await fetch("/api/addToCart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedProduct),
      });
      if (res.ok) {
        setCartMessage("✅ Product added to cart!");
        setTimeout(() => setCartMessage(""), 2000);
      } else {
        setCartMessage("⚠️ Product is already in cart.");
        setTimeout(() => setCartMessage(""), 2000);
      }
    } catch (err) {
      console.error("Add to cart failed:", err);
    }
  };

  const closePopup = () => {
    setPopupVisible(false);
    setSelectedProduct(null);
  };

  return (
    <div className="flex min-h-screen">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-gray-100 relative mt-16 md:mt-0">
        <Header/>

        <div className="mb-6 flex justify-center">
          <SearchBar 
            placeholder="Search products by name or description..." 
            onSearch={handleSearch}
            className="w-full max-w-2xl"
          />
        </div>

        {loading ? (
          <p className="text-center text-gray-600 mt-20">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-center text-gray-600 mt-20">
            {products.length === 0 ? "No products available." : "No products found matching your search."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white shadow-md rounded-lg p-4 hover:shadow-xl transition"
              >
                <div className="h-40 sm:h-48 bg-gray-200 rounded mb-4 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.idUrl}
                    alt={product.productName}
                    className="object-cover h-full w-full"
                  />
                </div>
                <h2 className="text-base sm:text-lg font-semibold truncate">
                  {product.productName}
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">₱{product.price}</p>
                <button
                  onClick={() => handleView(product)}
                  className="mt-3 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition cursor-pointer text-sm sm:text-base"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}

        {popupVisible && selectedProduct && (
          <div className="fixed inset-0 flex justify-center items-center backdrop-blur-md z-50 p-4">
            <div
              className={`bg-white p-4 sm:p-6 rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out ${
                popupVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              <div className="relative">
                <img
                  src={selectedProduct.idUrl}
                  alt={selectedProduct.productName}
                  className="w-full h-48 sm:h-56 object-cover rounded-2xl mb-4"
                />
                <button
                  onClick={closePopup}
                  className="absolute top-2 right-2 bg-white/70 hover:bg-white text-gray-700 rounded-full p-2 shadow-md transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {selectedProduct.productName}
              </h2>

              <p className="text-gray-600 mb-3 leading-relaxed text-sm sm:text-base">
                {selectedProduct.description}
              </p>

              <p className="text-red-600 font-bold text-lg sm:text-xl mb-5">
                ₱{selectedProduct.price}
              </p>

              <button
                onClick={handleAddToCart}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 sm:py-3 rounded-xl font-semibold hover:scale-[1.02] active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                🛒 Add to Cart
              </button>

              {cartMessage && (
                <div className="mt-4 text-center text-green-600 font-medium text-xs sm:text-sm">
                  {cartMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}