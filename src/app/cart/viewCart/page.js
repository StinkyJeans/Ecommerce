"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faTrash,
  faPlus,
  faMinus,
  faShoppingCart,
  faShoppingBag,
  faExclamationCircle,
  faTimes,
  faSpinner,
  faReceipt,
  faLock,
  faShieldAlt,
  faTruck,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";

export default function ViewCart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { username } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!username) {
      router.push("/");
      return;
    }
    fetchCart();
  }, [username, router]);

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

  const handleQuantityChange = async (itemId, action) => {
    setUpdatingId(itemId);
    setErrorMessage("");

    try {
      const res = await fetch(
        `/api/updateCartQuantity?id=${itemId}&action=${action}&username=${encodeURIComponent(
          username
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.removed) {
          // Item was removed because quantity reached 0
          setCartItems((prevItems) =>
            prevItems.filter((item) => item._id !== itemId)
          );
        } else {
          // Update the quantity in the UI
          setCartItems((prevItems) =>
            prevItems.map((item) =>
              item._id === itemId
                ? { ...item, quantity: data.cartItem.quantity }
                : item
            )
          );
        }
      } else {
        setErrorMessage(data.message || "Failed to update quantity");
      }
    } catch (error) {
      console.error("Update quantity failed:", error);
      setErrorMessage(`Error: ${error.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setRemovingId(itemId);
    setErrorMessage("");

    try {
      const url = `/api/removeFromCart?id=${itemId}&username=${encodeURIComponent(
        username
      )}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCartItems((prevItems) =>
          prevItems.filter((item) => item._id !== itemId)
        );
      } else {
        setErrorMessage(data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Remove failed:", error);
      setErrorMessage(`Error: ${error.message}`);
    } finally {
      setRemovingId(null);
    }
  };

  const calculateSubtotal = (price, quantity) => {
    return (parseFloat(price) * quantity).toFixed(2);
  };

  const calculateTotal = () => {
    return cartItems
      .reduce(
        (total, item) =>
          total + parseFloat(item.price || 0) * (item.quantity || 1),
        0
      )
      .toFixed(2);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Your order is confirmed and now ready to ship");
      router.push("/shippedItems");
    }
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
              <FontAwesomeIcon icon={faExclamationCircle} className="text-red-600 text-xl" />
              <div className="flex-1">
                <p className="text-red-800 font-semibold">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage("")}
                className="text-red-600 hover:text-red-800"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faShoppingCart} className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  My Shopping Cart
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  {cartItems.reduce(
                    (total, item) => total + (item.quantity || 1),
                    0
                  )}{" "}
                  items in your cart
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
                  <FontAwesomeIcon icon={faShoppingCart} className="text-5xl text-red-500" />
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
                  <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
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
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <h2 className="text-lg font-bold text-gray-900 mb-2">
                              {item.productName}
                            </h2>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {item.description}
                            </p>
                          </div>

                          <button
                            onClick={() => handleRemove(item._id)}
                            disabled={removingId === item._id}
                            className="cursor-pointer p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove from cart"
                          >
                            {removingId === item._id ? (
                              <FontAwesomeIcon icon={faSpinner} className="text-lg animate-spin" />
                            ) : (
                              <FontAwesomeIcon
                                icon={faTrash}
                                className="text-lg"
                              />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                              Quantity:
                            </span>
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                              <button
                                onClick={() =>
                                  handleQuantityChange(item._id, "decrease")
                                }
                                disabled={updatingId === item._id}
                                className="cursor-pointer w-8 h-8 flex items-center justify-center bg-white rounded-md hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                              >
                                <FontAwesomeIcon
                                  icon={faMinus}
                                  className="text-sm"
                                />
                              </button>
                              <span className="w-12 text-center font-bold text-gray-800">
                                {updatingId === item._id ? (
                                  <FontAwesomeIcon icon={faSpinner} className="text-sm animate-spin" />
                                ) : (
                                  item.quantity || 1
                                )}
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(item._id, "increase")
                                }
                                disabled={updatingId === item._id}
                                className="cursor-pointer w-8 h-8 flex items-center justify-center bg-white rounded-md hover:bg-green-50 hover:text-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                              >
                                <FontAwesomeIcon
                                  icon={faPlus}
                                  className="text-sm"
                                />
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">
                              Subtotal
                            </p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                              ₱
                              {calculateSubtotal(
                                item.price,
                                item.quantity || 1
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FontAwesomeIcon icon={faReceipt} className="text-red-600" />
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

                  <button
                    onClick={handleCheckout}
                    className="cursor-pointer w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mb-4"
                  >
                    <FontAwesomeIcon icon={faLock} />
                    Proceed to Checkout
                  </button>

                  <button className="cursor-pointer w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-red-500 hover:text-red-600 transition-all">
                    Apply Coupon Code
                  </button>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <FontAwesomeIcon icon={faShieldAlt} className="text-green-600" />
                        <span>Secure checkout</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <FontAwesomeIcon icon={faTruck} className="text-blue-600" />
                        <span>Free delivery on orders over ₱500</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <FontAwesomeIcon icon={faUndo} className="text-purple-600" />
                        <span>30-day return policy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
