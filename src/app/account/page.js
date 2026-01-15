"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { formatPrice } from "@/lib/formatPrice";
import { orderFunctions, shippingFunctions } from "@/lib/supabase/api";
import { getImageUrl } from "@/lib/supabase/storage";
import Header from "@/app/components/header";
import Navbar from "@/app/components/navbar";
import SellerNavbar from "@/app/seller/components/sellerNavbar";
import Pagination from "@/app/components/Pagination";
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
  const { username, role, loading: authLoading } = useAuth();
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
  const [addressesPage, setAddressesPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const itemsPerPage = 10;

  useLoadingFavicon(authLoading || loading, "Manage My Account");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "orders") {
      setActiveTab("orders");
    } else if (tabParam === "addresses") {
      setActiveTab("addresses");
    } else {
      setActiveTab("addresses");
    }
    // Reset pagination when tab changes
    setAddressesPage(1);
    setOrdersPage(1);
  }, [searchParams]);

  // Calculate paginated addresses
  const paginatedAddresses = useMemo(() => {
    const startIndex = (addressesPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return addresses.slice(startIndex, endIndex);
  }, [addresses, addressesPage, itemsPerPage]);

  const addressesTotalPages = Math.ceil(addresses.length / itemsPerPage);

  // Calculate paginated orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (ordersPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orders.slice(startIndex, endIndex);
  }, [orders, ordersPage, itemsPerPage]);

  const ordersTotalPages = Math.ceil(orders.length / itemsPerPage);

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
      const data = await shippingFunctions.getAddresses(username);
      if (data.success) {
        setAddresses(data.addresses || []);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await orderFunctions.getOrders(username);
      setOrders(data.orders || []);
    } catch (error) {
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
      const data = await shippingFunctions.deleteAddress(id, username);

      if (data.success) {
        setMessage({ text: "Address deleted successfully", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        fetchAddresses();
      } else {
        setMessage({ text: data.message || "Failed to delete address", type: "error" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.message || error.message || "Something went wrong";
      setMessage({ text: errorMessage, type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const handleSubmitAddress = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      const data = editingAddress
        ? await shippingFunctions.updateAddress(body)
        : await shippingFunctions.addAddress(body);

      if (data.success) {
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
        // Show detailed error message
        const errorMsg = data.errors 
          ? (Array.isArray(data.errors) ? data.errors.join(", ") : data.errors)
          : (data.message || "Failed to save address");
        setMessage({ text: errorMsg, type: "error" });
        setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      }
    } catch (error) {
      // Show detailed error message
      const errorMessage = error.response?.data?.errors 
        ? (Array.isArray(error.response.data.errors) ? error.response.data.errors.join(", ") : error.response.data.errors)
        : (error.response?.data?.message || error.response?.message || error.message || "Something went wrong");
      setMessage({ text: errorMessage, type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex">
      {role === 'seller' || role === 'admin' ? <SellerNavbar /> : <Navbar />}
      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col">
        <div className="z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <Header />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl w-full">
            <div className="mb-4 sm:mb-6 md:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent px-1">
                Manage My Account
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base mt-2 sm:mt-3 px-1">
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
            <div className={`mb-4 sm:mb-6 p-4 sm:p-5 rounded-lg ${
              message.type === "success" 
                ? "bg-green-50 text-green-800 border border-green-200" 
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              <div className="flex items-start gap-2 sm:gap-3">
                <FontAwesomeIcon 
                  icon={message.type === "success" ? faCheck : faTimes} 
                  className="text-base sm:text-lg mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm sm:text-base break-words">{message.text}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 pb-4 sm:pb-6 border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab("addresses");
                router.push("/account?tab=addresses");
              }}
              className={`min-h-[44px] px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
                activeTab === "addresses"
                  ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-sm sm:text-base" />
              <span>Shipping Addresses</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("orders");
                router.push("/account?tab=orders");
              }}
              className={`min-h-[44px] px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${
                activeTab === "orders"
                  ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <FontAwesomeIcon icon={faBox} className="text-sm sm:text-base" />
              <span>My Orders</span>
            </button>
          </div>

          {activeTab === "addresses" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 px-1">
                  Shipping Addresses
                </h2>
                <button
                  onClick={handleAddAddress}
                  className="min-h-[44px] w-full sm:w-auto px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-sm sm:text-base" />
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

                    <form onSubmit={handleSubmitAddress} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                      <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3 px-1">
                          Full Name *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                            <FontAwesomeIcon icon={faUser} className="text-gray-400 text-sm sm:text-base" />
                          </div>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
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
                          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3 px-1">
                            Postal Code *
                          </label>
                          <input
                            type="text"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            className="w-full px-4 py-3 sm:py-3.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            placeholder="e.g., 1234"
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
                <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 md:p-12 text-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-4xl sm:text-5xl md:text-6xl text-gray-300 mb-4 sm:mb-6" />
                  <p className="text-gray-600 text-base sm:text-lg md:text-xl mb-4 sm:mb-6 px-2">No shipping addresses yet</p>
                  <button
                    onClick={handleAddAddress}
                    className="min-h-[44px] px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-sm sm:text-base" />
                    <span>Add Your First Address</span>
                  </button>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                  {paginatedAddresses.map((address) => (
                    <div
                      key={address.id}
                      className={`bg-white rounded-xl shadow-md p-4 sm:p-5 md:p-6 border-2 transition-all flex flex-col ${
                        address.is_default
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {address.is_default && (
                        <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs sm:text-sm font-semibold rounded-full">
                          <FontAwesomeIcon icon={faCheck} className="text-xs" />
                          <span>Default Address</span>
                        </div>
                      )}
                      <div className="space-y-2 sm:space-y-3 flex-1 mb-4 sm:mb-6">
                        <p className="font-bold text-base sm:text-lg md:text-xl text-gray-800">{address.full_name}</p>
                        <p className="text-gray-600 text-sm sm:text-base">{address.phone_number}</p>
                        <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </p>
                        <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                          {address.city}, {address.province} {address.postal_code}
                        </p>
                        <p className="text-gray-700 text-sm sm:text-base">{address.country}</p>
                      </div>
                      <div className="flex gap-2 sm:gap-3 mt-auto pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="min-h-[44px] flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-xs sm:text-sm" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="min-h-[44px] flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-xs sm:text-sm" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {addressesTotalPages > 1 && (
                  <Pagination
                    currentPage={addressesPage}
                    totalPages={addressesTotalPages}
                    onPageChange={setAddressesPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={addresses.length}
                  />
                )}
                </>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 px-1">
                My Orders
              </h2>

              {orders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 md:p-12 text-center">
                  <FontAwesomeIcon icon={faBox} className="text-4xl sm:text-5xl md:text-6xl text-gray-300 mb-4 sm:mb-6" />
                  <p className="text-gray-600 text-base sm:text-lg md:text-xl mb-4 sm:mb-6 px-2">No orders yet</p>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="min-h-[44px] mt-4 sm:mt-6 px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <>
                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {paginatedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl shadow-md p-4 sm:p-5 md:p-6 border border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                              {order.id_url ? (
                                <img
                                  src={order.id_url || '/placeholder-image.jpg'}
                                  alt={order.product_name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  style={{ minHeight: '100%', minWidth: '100%' }}
                                  onError={(e) => {
                                    e.target.src = '/placeholder-image.jpg';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <FontAwesomeIcon icon={faBox} className="text-gray-400 text-xl sm:text-2xl" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                              <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-800 line-clamp-2">
                                {order.product_name}
                              </h3>
                              <p className="text-gray-600 text-xs sm:text-sm">
                                Seller: <span className="font-medium">{order.seller_username}</span>
                              </p>
                              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
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
                        <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 md:gap-3">
                          <div className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${
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
                          <div className="text-right sm:text-left">
                            <p className="text-base sm:text-lg md:text-xl font-bold text-red-600 mb-1">
                              ₱{formatPrice(order.total_amount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {ordersTotalPages > 1 && (
                  <Pagination
                    currentPage={ordersPage}
                    totalPages={ordersTotalPages}
                    onPageChange={setOrdersPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={orders.length}
                  />
                )}
                </>
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
