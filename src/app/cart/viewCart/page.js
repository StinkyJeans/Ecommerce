"use client";

import { useEffect, useState, useMemo } from "react";
import ProductImage from "@/app/components/ProductImage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { formatPrice } from "@/lib/formatPrice";
import { cartFunctions } from "@/lib/supabase/api";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { useCart } from "@/app/hooks/useCart";
import ThemeToggle from "@/app/components/ThemeToggle";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { Trash, Plus, Minus, ShoppingBag, AlertCircle, Timer, ArrowRight } from "griddy-icons";

export default function ViewCart() {
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [clearingCart, setClearingCart] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { username } = useAuth();
  const { cartItems, loading, invalidateCart, isError, queryClient } = useCart(username);
  useEffect(() => {
    if (isError) setErrorMessage("Failed to load cart");
  }, [isError]);

  useLoadingFavicon(loading, "Shopping Cart");

  useEffect(() => {
    if (!username) {
      router.push("/");
    }
  }, [username, router]);

  const handleQuantityChange = async (itemId, action) => {
    setUpdatingId(itemId);
    setErrorMessage("");

    // Find the item to update optimistically
    const itemToUpdate = cartItems.find(item => item.id === itemId);
    if (!itemToUpdate) {
      setErrorMessage("Item not found");
      setUpdatingId(null);
      return;
    }

    // Calculate new quantity optimistically
    const currentQuantity = itemToUpdate.quantity || 1;
    let optimisticQuantity;
    if (action === 'increase') {
      optimisticQuantity = currentQuantity + 1;
    } else if (action === 'decrease') {
      optimisticQuantity = Math.max(1, currentQuantity - 1);
    } else {
      setUpdatingId(null);
      return;
    }

    // Optimistically update the cart in React Query cache for instant UI update
    // This happens BEFORE the API call so UI updates immediately
    if (queryClient && username) {
      queryClient.setQueryData(['cart', username], (oldCart = []) => {
        if (action === 'decrease' && currentQuantity <= 1) {
          // Remove item if decreasing from 1
          return oldCart.filter(item => item.id !== itemId);
        }
        return oldCart.map(item => 
          item.id === itemId 
            ? { ...item, quantity: optimisticQuantity }
            : item
        );
      });
    }

    // Store original cart state for potential rollback
    const originalCart = [...cartItems];

    try {
      const data = await cartFunctions.updateCartQuantity(itemId, action, username);

      if (data.success) {
        // Update cache with server response to ensure consistency
        // This happens without triggering a full refetch
        if (queryClient && username && data.cartItem) {
          queryClient.setQueryData(['cart', username], (oldCart = []) => {
            if (data.removed) {
              // Item was removed (decreased from 1)
              return oldCart.filter(item => item.id !== itemId);
            }
            // Update the item with server response
            return oldCart.map(item => 
              item.id === itemId 
                ? { ...item, quantity: data.cartItem.quantity }
                : item
            );
          });
        }
        // Refetch in background after delay to ensure full sync (non-blocking)
        setTimeout(() => {
          queryClient?.refetchQueries({ 
            queryKey: ['cart', username],
            type: 'active'
          });
        }, 500);
        window.dispatchEvent(new Event("cartUpdated"));
        setErrorMessage(""); // Clear any previous errors
      } else {
        // Revert optimistic update on error by restoring original cart
        if (queryClient && username) {
          queryClient.setQueryData(['cart', username], originalCart);
        }
        setErrorMessage(data.message || "Failed to update quantity");
        setTimeout(() => setErrorMessage(""), 5000);
      }
    } catch (error) {
      // Revert optimistic update on error by restoring original cart
      if (queryClient && username) {
        queryClient.setQueryData(['cart', username], originalCart);
      }
      const errorMessage = error?.response?.message || 
                          error?.message || 
                          "Failed to update quantity";
      setErrorMessage(errorMessage);
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setRemovingId(itemId);
    setErrorMessage("");

    try {
      const data = await cartFunctions.removeFromCart(itemId, username);

      if (data.success) {
        invalidateCart();
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        setErrorMessage(data.message || "Failed to remove item");
      }
    } catch (error) {
      setErrorMessage(`Error: ${error.message || "Failed to remove item"}`);
    } finally {
      setRemovingId(null);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.price || 0) * (item.quantity || 1);
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.06;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setErrorMessage("Your cart is empty");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const itemIds = cartItems.map(item => item.id);
    router.push(`/checkout?items=${encodeURIComponent(JSON.stringify(itemIds))}`);
  };

  const [optimisticCleared, setOptimisticCleared] = useState(false);

  const handleClearCart = async () => {
    if (cartItems.length === 0) return;
    setErrorMessage("");
    setOptimisticCleared(true);
    setClearingCart(true);
    try {
      let data;
      try {
        data = await cartFunctions.clearCart();
      } catch (first) {
        await new Promise((r) => setTimeout(r, 500));
        data = await cartFunctions.clearCart();
      }
      if (data?.success) {
        invalidateCart();
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        setOptimisticCleared(false);
        setErrorMessage(data?.message || "Failed to clear cart");
      }
    } catch (e) {
      setOptimisticCleared(false);
      setErrorMessage(e?.message || "Failed to clear cart");
      invalidateCart();
    } finally {
      setClearingCart(false);
    }
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = calculateTotal();

  return (
    <>
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/dashboard")}>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Totally Normal</span>
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Store</span>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Shop</button>
                <button className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Categories</button>
                <button className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Deals</button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-8 py-3">
            <nav className="text-sm text-gray-500 dark:text-gray-400">
              <span className="hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer" onClick={() => router.push("/dashboard")}>Home</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 dark:text-gray-100 font-semibold">Cart</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {errorMessage && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-800 dark:text-red-300 font-semibold">{errorMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="flex flex-col items-center gap-3">
                <LoadingSpinner size="md" color="orange" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your cart...</p>
              </div>
            </div>
          ) : cartItems.length === 0 || optimisticCleared ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag size={52} className="text-5xl text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {optimisticCleared && clearingCart ? "Clearing cart…" : "Your cart is empty"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {optimisticCleared && clearingCart
                  ? "Please wait a moment."
                  : "Looks like you haven't added any items to your cart yet. Start shopping to fill it up!"}
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Shopping Cart</h1>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 dark:text-gray-400">{cartItems.length} Items</span>
                      <button
                        type="button"
                        onClick={handleClearCart}
                        disabled={clearingCart}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                      >
                        {clearingCart ? "Clearing…" : "Clear cart"}
                      </button>
                    </div>
                  </div>

                  <div className="border-b border-gray-200 dark:border-gray-700 mb-4 pb-2">
                    <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <div className="col-span-6">Product</div>
                      <div className="col-span-3 text-center">Quantity</div>
                      <div className="col-span-3 text-right">Total</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 items-center pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="col-span-6 flex items-center gap-4">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                            <ProductImage
                              src={item.id_url || item.idUrl}
                              alt={item.product_name || item.productName}
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                              {item.product_name || item.productName}
                            </h3>
                            <button
                              onClick={() => handleRemove(item.id)}
                              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            >
                              REMOVE
                            </button>
                          </div>
                        </div>
                        <div className={`col-span-3 flex items-center justify-center gap-2 transition-all ${updatingId === item.id ? 'opacity-75' : ''}`}>
                          <button
                            onClick={() => handleQuantityChange(item.id, "decrease")}
                            disabled={updatingId === item.id}
                            className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-l-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            aria-label="Decrease quantity"
                          >
                            {updatingId === item.id ? (
                              <Timer size={14} className="text-xs animate-spin text-orange-500" />
                            ) : (
                              <Minus size={14} className="text-xs" />
                            )}
                          </button>
                          <div className="relative">
                            <input
                              type="number"
                              value={item.quantity ?? 1}
                              readOnly
                              className={`w-12 h-8 border-y border-gray-300 dark:border-gray-600 text-center text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 transition-all ${updatingId === item.id ? 'border-orange-300 dark:border-orange-600' : ''}`}
                            />
                            {updatingId === item.id && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 rounded backdrop-blur-sm pointer-events-none">
                                <Timer size={12} className="animate-spin text-orange-500" />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleQuantityChange(item.id, "increase")}
                            disabled={updatingId === item.id}
                            className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-r-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            aria-label="Increase quantity"
                          >
                            {updatingId === item.id ? (
                              <Timer size={14} className="text-xs animate-spin text-orange-500" />
                            ) : (
                              <Plus size={14} className="text-xs" />
                            )}
                          </button>
                        </div>
                        <div className="col-span-3 text-right">
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            ₱{formatPrice(parseFloat(item.price || 0) * (item.quantity || 1))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Order Summary</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">₱{formatPrice(subtotal.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Estimated Tax</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">₱{formatPrice(tax.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Total</span>
                      <span className="text-2xl font-bold text-orange-500">₱{formatPrice(total.toFixed(2))}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0}
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete Purchase
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
    </>
  );
}
