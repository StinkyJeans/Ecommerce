"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import Navbar from "../components/sellerNavbar";

export default function SellerDashboard() {
  const { role, username, loading, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [Loading, setLoading] = useState(true);
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/getProduct");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!loading && role !== "seller") {
      router.push("/");
    }
  }, [role, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-lg">
        Loading...
      </div>
    );
  }
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
  const handleView = (product) => {
    setSelectedProduct(product);
    setPopupVisible(true);
  };

  if (role !== "seller") return null;

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    logout();
    router.replace("/");
  };

  return (
    <div className="flex h-screen">
      <Navbar />

      <main className="flex-1 p-6 overflow-auto bg-gray-100 relative">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-3xl font-bold text-red-600">Featured Products</h1>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-4">
              <FontAwesomeIcon
                icon={faShoppingCart}
                className="text-red-600 text-2xl cursor-pointer hover:text-red-700 transition"
                onClick={() => router.push("/seller/sellerCart")}
              />
              <span className="font-semibold text-gray-700">
                👤 {username || "Loading..."}
              </span>
              <button
                onClick={handleLogout}
                className="px-5 py-2 bg-red-600 rounded text-white hover:bg-red-700 transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="bg-white shadow-md rounded-lg p-4 hover:shadow-xl transition"
              >
                <div className="h-40 bg-gray-200 rounded mb-4 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.idUrl}
                    alt={product.productName}
                    className="object-cover h-auto w-auto"
                  />
                </div>
                <h2 className="text-lg font-semibold">{product.productName}</h2>
                <p className="text-gray-600">₱{product.price}</p>
                <button
                  onClick={() => handleView(product)}
                  className="mt-3 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition cursor-pointer"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}

        {popupVisible && selectedProduct && (
          <div className="fixed inset-0 flex justify-center items-center backdrop-blur-md z-50">
            <div
              className={`bg-white p-6 rounded-3xl shadow-2xl w-[26rem] transform transition-all duration-300 ease-out ${
                popupVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
              }`}
            >
              <div className="relative">
                <img
                  src={selectedProduct.idUrl}
                  alt={selectedProduct.productName}
                  className="w-full h-56 object-cover rounded-2xl mb-4"
                />
                <button
                  onClick={closePopup}
                  className="absolute top-2 right-2 bg-white/70 hover:bg-white text-gray-700 rounded-full p-2 shadow-md transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedProduct.productName}
              </h2>

              <p className="text-gray-600 mb-3 leading-relaxed">
                {selectedProduct.description}
              </p>

              <p className="text-red-600 font-bold text-xl mb-5">
                ₱{selectedProduct.price}
              </p>

              <button
                onClick={handleAddToCart}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:scale-[1.02] active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                🛒 Add to Cart
              </button>

              {cartMessage && (
                <div className="mt-4 text-center text-green-600 font-medium text-sm">
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
