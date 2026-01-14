"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { formatPrice } from "@/lib/formatPrice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import Navbar from "@/app/components/navbar";
import Header from "@/app/components/header";
import {
  faTrash,
  faEdit,
  faChevronRight,
  faSpinner,
  faMapMarkerAlt,
  faPhone,
  faCreditCard,
  faMoneyBillWave,
  faExclamationCircle,
  faTimes,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [deliveryOption, setDeliveryOption] = useState("standard");
  const [voucherCode, setVoucherCode] = useState("");
  const [shippingFee, setShippingFee] = useState(128.16);
  const [errorMessage, setErrorMessage] = useState("");

  useLoadingFavicon(authLoading || loading || placingOrder, "Checkout");

  useEffect(() => {
    if (!authLoading && !username) {
      router.push("/");
      return;
    }
    if (username) {
      fetchCartItems();
      fetchAddresses();
    }
  }, [username, authLoading, router]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      }
    }
  }, [addresses]);

  const fetchCartItems = async () => {
    try {
      const itemsParam = searchParams.get("items");
      if (!itemsParam) {
        router.push("/cart/viewCart");
        return;
      }

      const itemIds = JSON.parse(decodeURIComponent(itemsParam));
      const res = await fetch(`/api/getCart?username=${username}`);
      const data = await res.json();
      
      const selectedItems = (data.cart || []).filter(item => itemIds.includes(item.id));
      setCartItems(selectedItems);
    } catch (error) {
      console.error("Fetch cart items error:", error);
      setErrorMessage("Failed to load cart items");
      router.push("/cart/viewCart");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`/api/shipping-addresses?username=${username}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.price || 0) * (item.quantity || 1);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + shippingFee;
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

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setErrorMessage("Please select a shipping address");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setPlacingOrder(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          items: cartItems.map(item => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name || item.productName,
            price: item.price,
            quantity: item.quantity,
            seller_username: item.seller_username || 'Unknown',
            id_url: item.id_url || item.idUrl
          })),
          shipping_address_id: selectedAddress.id,
          payment_method: paymentMethod,
          delivery_option: deliveryOption
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/account?tab=orders");
      } else {
        setErrorMessage(data.message || "Failed to place order");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Place order error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setPlacingOrder(false);
    }
  };

  const groupedItems = groupItemsBySeller();
  const subtotal = calculateSubtotal();
  const total = calculateTotal();

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Shipping Address</h2>
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faEdit} className="text-sm" />
                      Edit
                    </button>
                  </div>
                  
                  {selectedAddress ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">{selectedAddress.full_name}</p>
                      <p className="text-gray-600 flex items-center gap-2">
                        <FontAwesomeIcon icon={faPhone} className="text-sm" />
                        {selectedAddress.phone_number}
                      </p>
                      <p className="text-gray-600 flex items-start gap-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-sm mt-1" />
                        <span>
                          {selectedAddress.address_line1}
                          {selectedAddress.address_line2 && `, ${selectedAddress.address_line2}`}
                          <br />
                          {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postal_code}
                          <br />
                          {selectedAddress.country}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-600 mb-4">No shipping address selected</p>
                      <button
                        onClick={() => router.push("/account?tab=addresses")}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Add Shipping Address
                      </button>
                    </div>
                  )}
                </div>

                {Object.entries(groupedItems).map(([sellerUsername, items], packageIndex) => (
                  <div key={sellerUsername} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800">
                          Package {packageIndex + 1} of {Object.keys(groupedItems).length}
                        </span>
                        <span className="text-sm text-gray-600">Fulfilled by {sellerUsername}</span>
                      </div>
                    </div>

                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-800 mb-3">Choose your delivery option</h3>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 border-2 border-red-500 rounded-lg cursor-pointer bg-red-50">
                          <input
                            type="radio"
                            name="delivery"
                            value="standard"
                            checked={deliveryOption === "standard"}
                            onChange={(e) => setDeliveryOption(e.target.value)}
                            className="w-5 h-5 text-red-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-800">Standard</span>
                              <span className="font-bold text-red-600">₱{formatPrice(shippingFee.toFixed(2))}</span>
                            </div>
                            <p className="text-sm text-gray-600">Guaranteed by 17-25 Jan.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {items.map((item) => {
                        const itemPrice = parseFloat(item.price || 0);
                        const itemQuantity = item.quantity || 1;

                        return (
                          <div key={item.id} className="p-4">
                            <div className="flex gap-4">
                              <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                  src={item.id_url || item.idUrl}
                                  alt={item.product_name || item.productName}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 96px, 128px"
                                  loading="lazy"
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
                                <div className="flex items-center gap-4 mb-2">
                                  <span className="text-lg font-bold text-red-600">
                                    ₱{formatPrice(itemPrice)}
                                  </span>
                                  {itemPrice < parseFloat(item.price) * 1.5 && (
                                    <>
                                      <span className="text-sm text-gray-400 line-through">
                                        ₱{formatPrice((itemPrice * 1.5).toFixed(2))}
                                      </span>
                                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                        53% OFF
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Qty: {itemQuantity}</span>
                                  <button
                                    onClick={() => router.push("/cart/viewCart")}
                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                                    title="Remove from cart"
                                  >
                                    <FontAwesomeIcon icon={faTrash} className="text-base" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 lg:sticky lg:top-6 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Select payment method</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-4 border-2 border-red-500 rounded-lg cursor-pointer bg-red-50">
                        <input
                          type="radio"
                          name="payment"
                          value="cod"
                          checked={paymentMethod === "cod"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-5 h-5 text-red-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-red-600" />
                            <span className="font-semibold text-gray-800">Cash on Delivery</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Pay when you receive</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                        <input
                          type="radio"
                          name="payment"
                          value="card"
                          checked={paymentMethod === "card"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-5 h-5 text-red-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faCreditCard} className="text-gray-600" />
                            <span className="font-semibold text-gray-800">Credit/Debit Card</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Tap to add card</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">Voucher</h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        placeholder="Enter Voucher Code"
                        className="flex-1 min-w-0 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      />
                      <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs sm:text-sm transition-colors whitespace-nowrap">
                        APPLY
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">Invoice and Contact Info</h3>
                      <button className="text-red-600 hover:text-red-700 font-semibold text-sm">
                        Edit
                      </button>
                    </div>
                    {selectedAddress && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{selectedAddress.full_name}</p>
                        <p>{selectedAddress.phone_number}</p>
                        <p>{username}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Order Detail</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          Subtotal ({cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0) === 1 ? 'Item' : 'Items'})
                        </span>
                        <span className="font-semibold text-gray-800">
                          ₱{formatPrice(subtotal.toFixed(2))}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Shipping Fee</span>
                        <span className="font-semibold text-gray-800">
                          ₱{formatPrice(shippingFee.toFixed(2))}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <span className="text-lg font-bold text-gray-800">Total:</span>
                        <span className="text-xl font-bold text-orange-600">
                          ₱{formatPrice(total.toFixed(2))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder || !selectedAddress || cartItems.length === 0}
                    className="cursor-pointer w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {placingOrder ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      "PLACE ORDER NOW"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showAddressModal && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddressModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-800">Select Shipping Address</h2>
              <button
                onClick={() => setShowAddressModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              {addresses.length === 0 ? (
                <div className="text-center py-12">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-5xl text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-4">No saved addresses found</p>
                  <button
                    onClick={() => {
                      setShowAddressModal(false);
                      router.push("/account?tab=addresses");
                    }}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Add New Address
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAddress?.id === address.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                      onClick={() => {
                        setSelectedAddress(address);
                        setShowAddressModal(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-gray-900">{address.full_name}</p>
                            {address.is_default && (
                              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 flex items-center gap-2 mb-1">
                            <FontAwesomeIcon icon={faPhone} className="text-sm" />
                            {address.phone_number}
                          </p>
                          <p className="text-gray-600 flex items-start gap-2">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-sm mt-1" />
                            <span>
                              {address.address_line1}
                              {address.address_line2 && `, ${address.address_line2}`}
                              <br />
                              {address.city}, {address.province} {address.postal_code}
                              <br />
                              {address.country}
                            </span>
                          </p>
                        </div>
                        {selectedAddress?.id === address.id && (
                          <FontAwesomeIcon icon={faCheckCircle} className="text-red-600 text-xl ml-4" />
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      setShowAddressModal(false);
                      router.push("/account?tab=addresses");
                    }}
                    className="w-full mt-4 px-6 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-red-500 hover:text-red-600 font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Add New Address
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
