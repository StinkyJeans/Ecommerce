"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { formatPrice } from "@/lib/formatPrice";
import Header from "@/app/components/header";
import Navbar from "@/app/components/navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faPlus,
  faEdit,
  faTrash,
  faCheck,
  faTimes,
  faBox,
  faUser,
  faPhone,
  faHome,
  faCity,
  faEnvelope,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("addresses");
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Philippines",
    isDefault: false
  });
  const [message, setMessage] = useState({ text: "", type: "" });

  useLoadingFavicon(authLoading || loading, "Manage My Account");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "orders") {
      setActiveTab("orders");
    } else {
      setActiveTab("addresses");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !username) {
      router.push("/");
      return;
    }
    if (username) {
      fetchAddresses();
      fetchOrders();
    }
  }, [username, authLoading, router]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`/api/shipping-addresses?username=${username}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAddresses(data.addresses || []);
      } else {
        console.error("Failed to fetch addresses:", data.message || "Unknown error");
        setAddresses([]);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/getOrders?username=${username}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      } else {
        console.error("Failed to fetch orders:", data.message || "Unknown error");
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setFormData({
      fullName: "",
      phoneNumber: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      province: "",
      postalCode: "",
      country: "Philippines",
      isDefault: false
    });
    setShowAddressForm(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setFormData({
      fullName: address.full_name || "",
      phoneNumber: address.phone_number || "",
      addressLine1: address.address_line1 || "",
      addressLine2: address.address_line2 || "",
      city: address.city || "",
      province: address.province || "",
      postalCode: address.postal_code || "",
      country: address.country || "Philippines",
      isDefault: address.is_default || false
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      const res = await fetch(`/api/shipping-addresses?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ text: "Address deleted successfully", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        fetchAddresses();
      } else {
        setMessage({ text: data.message || "Failed to delete address", type: "error" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (error) {
      console.error("Delete address error:", error);
      setMessage({ text: "Something went wrong", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const handleSubmitAddress = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingAddress 
        ? "/api/shipping-addresses"
        : "/api/shipping-addresses";
      const method = editingAddress ? "PUT" : "POST";

      const body = {
        ...(editingAddress && { id: editingAddress.id }),
        username,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        country: formData.country,
        isDefault: formData.isDefault
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ 
          text: editingAddress ? "Address updated successfully" : "Address added successfully", 
          type: "success" 
        });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        setShowAddressForm(false);
        setEditingAddress(null);
        setFormData({
          fullName: "",
          phoneNumber: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          province: "",
          postalCode: "",
          country: "Philippines",
          isDefault: false
        });
        fetchAddresses();
      } else {
        setMessage({ text: data.message || "Failed to save address", type: "error" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (error) {
      console.error("Save address error:", error);
      setMessage({ text: "Something went wrong", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } finally {
      setLoading(false);
    }
  };

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
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Manage My Account
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mt-2">
                Manage your shipping addresses and orders
              </p>
            </div>

          {(authLoading || loading) && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
                <p className="text-gray-600 font-medium">Loading...</p>
              </div>
            </div>
          )}
          
          {!authLoading && !loading && (
            <>
              {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === "success" 
                ? "bg-green-50 text-green-800 border border-green-200" 
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon 
                  icon={message.type === "success" ? faCheck : faTimes} 
                  className="text-base"
                />
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("addresses")}
              className={`px-4 py-2 sm:py-2.5 rounded-lg font-semibold transition-all ${
                activeTab === "addresses"
                  ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-sm" />
              Shipping Addresses
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 sm:py-2.5 rounded-lg font-semibold transition-all ${
                activeTab === "orders"
                  ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FontAwesomeIcon icon={faBox} className="mr-2 text-sm" />
              My Orders
            </button>
          </div>

          {activeTab === "addresses" && (
            <div>
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Shipping Addresses
                </h2>
                <button
                  onClick={handleAddAddress}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-sm" />
                  <span>Add Address</span>
                </button>
              </div>

              {showAddressForm && (
                <div 
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                    }
                  }}
                >
                  <div 
                    className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-800">
                        {editingAddress ? "Edit Address" : "Add New Address"}
                      </h3>
                      <button
                        onClick={() => {
                          setShowAddressForm(false);
                          setEditingAddress(null);
                        }}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faTimes} className="text-xl" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmitAddress} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faUser} className="text-gray-400 text-sm" />
                          </div>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faPhone} className="text-gray-400 text-sm" />
                          </div>
                          <input
                            type="number"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address Line 1 *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faHome} className="text-gray-400 text-sm" />
                          </div>
                          <input
                            type="text"
                            value={formData.addressLine1}
                            onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address Line 2 (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.addressLine2}
                          onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <FontAwesomeIcon icon={faCity} className="text-gray-400 text-sm" />
                            </div>
                            <input
                              type="text"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Province *
                          </label>
                          <input
                            type="text"
                            value={formData.province}
                            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Postal Code *
                          </label>
                          <input
                            type="number"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country *
                          </label>
                          <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          checked={formData.isDefault}
                          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                          Set as default address
                        </label>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                              Saving...
                            </span>
                          ) : (
                            editingAddress ? "Update Address" : "Add Address"
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddress(null);
                          }}
                          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {addresses.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-6xl text-gray-300 mb-4" />
                  <p className="text-gray-600 text-lg mb-4">No shipping addresses yet</p>
                  <button
                    onClick={handleAddAddress}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`bg-white rounded-xl shadow-md p-5 sm:p-6 border-2 transition-all ${
                        address.is_default
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {address.is_default && (
                        <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                          <FontAwesomeIcon icon={faCheck} className="text-xs" />
                          Default Address
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="font-bold text-lg text-gray-800">{address.full_name}</p>
                        <p className="text-gray-600 text-sm">{address.phone_number}</p>
                        <p className="text-gray-700">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </p>
                        <p className="text-gray-700">
                          {address.city}, {address.province} {address.postal_code}
                        </p>
                        <p className="text-gray-700">{address.country}</p>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-xs" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                My Orders
              </h2>

              {orders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center">
                  <FontAwesomeIcon icon={faBox} className="text-6xl text-gray-300 mb-4" />
                  <p className="text-gray-600 text-lg">No orders yet</p>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl shadow-md p-5 sm:p-6 border border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                              {order.id_url ? (
                                <img
                                  src={order.id_url}
                                  alt={order.product_name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  style={{ minHeight: '100%', minWidth: '100%' }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <FontAwesomeIcon icon={faBox} className="text-gray-400 text-2xl" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg text-gray-800 mb-1 truncate">
                                {order.product_name}
                              </h3>
                              <p className="text-gray-600 text-sm mb-2">
                                Seller: {order.seller_username}
                              </p>
                              <div className="flex flex-wrap gap-3 text-sm">
                                <span className="text-gray-600">
                                  Quantity: <span className="font-semibold">{order.quantity}</span>
                                </span>
                                <span className="text-gray-600">
                                  Price: <span className="font-semibold">₱{formatPrice(order.price)}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 sm:gap-3">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "delivered"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {order.status.toUpperCase()}
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-red-600">
                            ₱{formatPrice(order.total_amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}
