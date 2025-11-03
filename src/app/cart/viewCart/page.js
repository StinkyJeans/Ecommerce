"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTrash } from "@fortawesome/free-solid-svg-icons";
import Navbar from "@/app/components/navbar";

export default function ViewCart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { username } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!username) {
      router.push("/");
      return;
    }
    const fetchCart = async () => {
      try {
        const res = await fetch(`/api/getCart?username=${username}`);
        const data = await res.json();
        setCartItems(data.cart || []);
      } catch (e) {
        console.error("Fetch cart error:", e);
        setErrorMessage("Failed to load cart");
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [username, router]);

  const handleRemove = async (itemId) => {
    console.log("=== REMOVE ITEM ===");
    console.log("Item ID:", itemId);
    console.log("Username:", username);

    setRemovingId(itemId);
    setErrorMessage("");

    try {
      const url = `/api/removeFromCart?id=${itemId}&username=${encodeURIComponent(
        username
      )}`;
      console.log("Requesting:", url);

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers.get("content-type"));

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Response is not JSON!");
        const text = await res.text();
        console.error("Response text:", text.substring(0, 200));
        setErrorMessage("Server error - API route may not exist");
        return;
      }

      const data = await res.json();
      console.log("Response data:", data);

      if (res.ok && data.success) {
        setCartItems((prevItems) =>
          prevItems.filter((item) => item._id !== itemId)
        );
        console.log("✅ Item removed successfully");
      } else {
        console.error("❌ Failed to remove item:", data.message);
        setErrorMessage(data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("❌ Remove failed:", error);
      setErrorMessage(`Error: ${error.message}`);
    } finally {
      setRemovingId(null);
    }
  };

  const calculateTotal = () => {
    return cartItems
      .reduce((total, item) => total + parseFloat(item.price || 0), 0)
      .toFixed(2);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -left-20 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-40 -right-20 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto mt-16 md:mt-0 relative">
        {errorMessage && (
          <div className="max-w-7xl mx-auto mb-4">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
              <i className="fas fa-exclamation-circle text-red-600 text-xl"></i>
              <div className="flex-1">
                <p className="text-red-800 font-semibold">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage("")}
                className="text-red-600 hover:text-red-800"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <i className="fas fa-shopping-cart text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Shopping Cart
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"}{" "}
                  in your cart
                </p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="cursor-pointer flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-3 rounded-xl hover:border-red-500 hover:text-red-600 transition-all shadow-sm hover:shadow-md font-semibold"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Continue Shopping
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="relative mb-6">
                <div className="h-20 w-20 border-4 border-red-200 rounded-full mx-auto"></div>
                <div className="h-20 w-20 border-4 border-t-red-600 rounded-full animate-spin absolute top-0 left-1/2 -translate-x-1/2"></div>
              </div>
              <p className="text-gray-700 font-semibold text-lg">
                Loading your cart...
              </p>
              <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md text-center border border-gray-100">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-shopping-cart text-5xl text-red-500"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Your cart is empty
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Looks like you haven't added any items to your cart yet. Start
                  shopping to fill it up!
                </p>
                <button
                  onClick={() => router.back()}
                  className="cursor-pointer px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <i className="fas fa-shopping-bag mr-2"></i>
                  Start Shopping
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item._id}
                    className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden ${
                      removingId === item._id ? "opacity-50 scale-95" : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4 p-5">
                      <div className="relative w-full sm:w-32 h-32 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden group">
                        <img
                          src={item.idUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h2 className="text-lg font-bold text-gray-900 mb-2">
                              {item.productName}
                            </h2>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {item.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                Price:
                              </span>
                              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                                ₱{item.price}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemove(item._id)}
                            disabled={removingId === item._id}
                            className="cursor-pointer p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove from cart"
                          >
                            {removingId === item._id ? (
                              <i className="fas fa-spinner fa-spin text-lg"></i>
                            ) : (
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="text-lg"
                              />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 pb-5 flex gap-3">
                      <button className="cursor-pointer flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                        <i className="fas fa-credit-card"></i>
                        Checkout
                      </button>
                      <button className="cursor-pointer px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:border-red-500 hover:text-red-600 transition-all font-semibold">
                        <i className="fas fa-heart"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <i className="fas fa-receipt text-red-600"></i>
                    Order Summary
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-gray-800">
                        ₱{calculateTotal()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-semibold text-green-600">FREE</span>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-semibold text-gray-800">₱0.00</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold text-gray-800">
                        Total
                      </span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                        ₱{calculateTotal()}
                      </span>
                    </div>
                  </div>

                  <button className="cursor-pointer w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mb-4">
                    <i className="fas fa-lock"></i>
                    Proceed to Checkout
                  </button>

                  <button className="cursor-pointer w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-red-500 hover:text-red-600 transition-all">
                    Apply Coupon Code
                  </button>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <i className="fas fa-shield-alt text-green-600"></i>
                        <span>Secure checkout</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <i className="fas fa-truck text-blue-600"></i>
                        <span>Free delivery on orders over ₱500</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <i className="fas fa-undo text-purple-600"></i>
                        <span>30-day return policy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="max-w-7xl mx-auto mt-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <i className="fas fa-star text-yellow-500"></i>
              You might also like
            </h3>
            <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
              <p className="text-gray-600 text-center">
                Recommended products will appear here
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
