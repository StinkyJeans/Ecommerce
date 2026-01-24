"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import ProductImage from "@/app/components/ProductImage";
import Pagination from "@/app/components/Pagination";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { formatPrice } from "@/lib/formatPrice";
import { cartFunctions } from "@/lib/supabase/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import Navbar from "@/app/components/navbar";
import Header from "@/app/components/header";
import {
  faTrash,
  faPlus,
  faMinus,
  faShoppingCart,
  faExclamationCircle,
  faTimes,
  faSpinner,
  faHeart,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

export default function ViewCart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [voucherCode, setVoucherCode] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { username } = useAuth();
  const router = useRouter();

  useLoadingFavicon(loading, "Shopping Cart");

  useEffect(() => {
    if (!username) {
      router.push("/");
      return;
    }
    fetchCart();
  }, [username, router]);

  const fetchCart = async () => {
    try {
      const data = await cartFunctions.getCart(username);
      setCartItems(data.cart || []);
      const allItemIds = new Set((data.cart || []).map(item => item.id));
      setSelectedItems(allItemIds);
    } catch (e) {
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
          setCartItems((prevItems) =>
            prevItems.filter((item) => item.id !== itemId)
          );
          setSelectedItems((prev) => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        } else {
          setCartItems((prevItems) =>
            prevItems.map((item) =>
              item.id === itemId
                ? { ...item, quantity: data.cartItem.quantity }
                : item
            )
          );
        }
      } else {
        setErrorMessage(data.message || "Failed to update quantity");
      }
    } catch (error) {
      setErrorMessage(`Error: ${error.message}`);
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
        setCartItems((prevItems) =>
          prevItems.filter((item) => item.id !== itemId)
        );
        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
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

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectSeller = (sellerUsername) => {
    const sellerItems = cartItems.filter(item => item.seller_username === sellerUsername);
    const allSelected = sellerItems.every(item => selectedItems.has(item.id));

    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      sellerItems.forEach(item => {
        if (allSelected) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
      });
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;

    const itemsToDelete = Array.from(selectedItems);
    for (const itemId of itemsToDelete) {
      await handleRemove(itemId);
    }
  };

  const groupItemsBySeller = () => {
    const grouped = {};
    cartItems.forEach(item => {
      const seller = item.seller_username || 'Unknown';
      if (!grouped[seller]) {
        grouped[seller] = [];
      }
      grouped[seller].push(item);
    });
    return grouped;
  };

  const calculateSelectedSubtotal = () => {
    return Array.from(selectedItems).reduce((total, itemId) => {
      const item = cartItems.find(i => i.id === itemId);
      if (item) {
        return total + parseFloat(item.price || 0) * (item.quantity || 1);
      }
      return total;
    }, 0);
  };

  const getSelectedItemCount = () => {
    return Array.from(selectedItems).reduce((count, itemId) => {
      const item = cartItems.find(i => i.id === itemId);
      return count + (item?.quantity || 0);
    }, 0);
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      setErrorMessage("Please select at least one item to checkout");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id));
    const itemIds = Array.from(selectedItems);

    router.push(`/checkout?items=${encodeURIComponent(JSON.stringify(itemIds))}`);
  };

  const groupedItems = groupItemsBySeller();
  const selectedCount = getSelectedItemCount();
  const selectedSubtotal = calculateSelectedSubtotal();

  const sellerGroups = Object.entries(groupedItems);
  const paginatedSellerGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sellerGroups.slice(startIndex, endIndex);
  }, [sellerGroups, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sellerGroups.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [cartItems.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex">
      <Navbar />
      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col">
        <div className="z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <Header />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
            {errorMessage && (
              <div className="mb-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <FontAwesomeIcon icon={faExclamationCircle} className="text-red-600 text-xl" />
                  <div className="flex-1">
                    <p className="text-red-800 font-semibold">{errorMessage}</p>
                  </div>
                  <button
                    onClick={() => setErrorMessage("")}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-base" />
                  </button>
                </div>
              </div>
            )}

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
                    onClick={() => router.push("/dashboard")}
                    className="cursor-pointer px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Start Shopping
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between border border-gray-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                        onChange={handleSelectAll}
                        className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                      />
                      <label className="font-semibold text-gray-800 cursor-pointer">
                        SELECT ALL ({cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} ITEM(S))
                      </label>
                    </div>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={selectedItems.size === 0}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      DELETE
                    </button>
                  </div>

                  {paginatedSellerGroups.map(([sellerUsername, items]) => {
                    const sellerSelected = items.every(item => selectedItems.has(item.id));
                    const sellerItemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

                    return (
                      <div key={sellerUsername} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={sellerSelected}
                              onChange={() => handleSelectSeller(sellerUsername)}
                              className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                            />
                            <span className="font-bold text-gray-800">{sellerUsername}</span>
                            <FontAwesomeIcon icon={faChevronRight} className="text-gray-400 text-sm ml-auto" />
                          </div>
                        </div>

                        <div className="divide-y divide-gray-200">
                          {items.map((item) => {
                            const isSelected = selectedItems.has(item.id);
                            const itemPrice = parseFloat(item.price || 0);
                            const itemQuantity = item.quantity || 1;

                            return (
                              <div
                                key={item.id}
                                className={`p-4 hover:bg-gray-50 transition-colors ${
                                  removingId === item.id ? "opacity-50" : ""
                                }`}
                              >
                                <div className="flex gap-4">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectItem(item.id)}
                                    className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer mt-1 flex-shrink-0"
                                  />

                                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                    <ProductImage
                                      src={item.id_url || item.idUrl}
                                      alt={item.product_name || item.productName}
                                      className="object-cover"
                                      sizes="(max-width: 640px) 96px, 128px"
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                      {item.product_name || item.productName}
                                    </h3>
                                    {item.description && (
                                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                                        {item.description}
                                      </p>
                                    )}
                                    <p className="text-lg font-bold text-red-600 mb-3">
                                      ₱{formatPrice(itemPrice)}
                                    </p>

                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                        <button
                                          onClick={() => handleQuantityChange(item.id, "decrease")}
                                          disabled={updatingId === item.id}
                                          className="w-8 h-8 flex items-center justify-center bg-white rounded-md hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <FontAwesomeIcon icon={faMinus} className="text-xs" />
                                        </button>
                                        <span className="w-12 text-center font-bold text-gray-800">
                                          {updatingId === item.id ? (
                                            <FontAwesomeIcon icon={faSpinner} className="text-xs animate-spin mx-auto" />
                                          ) : (
                                            itemQuantity
                                          )}
                                        </span>
                                        <button
                                          onClick={() => handleQuantityChange(item.id, "increase")}
                                          disabled={updatingId === item.id}
                                          className="w-8 h-8 flex items-center justify-center bg-white rounded-md hover:bg-green-50 hover:text-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <FontAwesomeIcon icon={faPlus} className="text-xs" />
                                        </button>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <button
                                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                                          title="Add to wishlist"
                                        >
                                          <FontAwesomeIcon icon={faHeart} className="text-base" />
                                        </button>
                                        <button
                                          onClick={() => handleRemove(item.id)}
                                          disabled={removingId === item.id}
                                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="Remove from cart"
                                        >
                                          {removingId === item.id ? (
                                            <FontAwesomeIcon icon={faSpinner} className="text-base animate-spin" />
                                          ) : (
                                            <FontAwesomeIcon icon={faTrash} className="text-base" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={sellerGroups.length}
                  />
                )}

                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 lg:sticky lg:top-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">
                      Order Summary
                    </h3>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-gray-600">
                          Subtotal ({selectedCount} {selectedCount === 1 ? 'item' : 'items'})
                        </span>
                        <span className="font-semibold text-gray-800">
                          ₱{formatPrice(selectedSubtotal.toFixed(2))}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                        <span className="text-gray-600">Shipping Fee</span>
                        <span className="font-semibold text-gray-800">₱0.00</span>
                      </div>

                      <div className="pt-3">
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value)}
                            placeholder="Enter Voucher Code"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                          />
                          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                            APPLY
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <span className="text-lg font-bold text-gray-800">
                          Subtotal
                        </span>
                        <span className="text-xl font-bold text-red-600">
                          ₱{formatPrice(selectedSubtotal.toFixed(2))}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 text-center">
                        VAT included, where applicable
                      </p>
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={selectedItems.size === 0}
                      className="cursor-pointer w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      PROCEED TO CHECKOUT ({selectedCount})
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
