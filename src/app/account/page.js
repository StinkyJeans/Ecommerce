"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { formatPrice } from "@/lib/formatPrice";
import { orderFunctions, shippingFunctions } from "@/lib/supabase/api";
import { getImageUrl } from "@/lib/supabase/storage";
import UserPortalSidebar from "@/app/components/UserPortalSidebar";
import Pagination from "@/app/components/Pagination";
import ThemeToggle from "@/app/components/ThemeToggle";
import CityAutocomplete from "@/app/components/CityAutocomplete";
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
  faSpinner,
  faGlobe,
  faCog,
  faUndo,
  faBriefcase
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
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Philippines",
    isDefault: false,
    addressType: "home"
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [addressesPage, setAddressesPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const itemsPerPage = 10;
  const [useFallbackMode, setUseFallbackMode] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState({
    province: false,
    country: false
  });
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCityFallback, setSelectedCityFallback] = useState("");

  // Fallback data for common countries
  const countryData = {
    Philippines: {
      provinces: [
        "Metro Manila", "Abra", "Agusan del Norte", "Agusan del Sur", "Aklan", "Albay",
        "Antique", "Apayao", "Aurora", "Basilan", "Bataan", "Batanes", "Batangas",
        "Benguet", "Biliran", "Bohol", "Bukidnon", "Bulacan", "Cagayan", "Camarines Norte",
        "Camarines Sur", "Camiguin", "Capiz", "Catanduanes", "Cavite", "Cebu", "Compostela Valley",
        "Cotabato", "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental",
        "Dinagat Islands", "Eastern Samar", "Guimaras", "Ifugao", "Ilocos Norte", "Ilocos Sur",
        "Iloilo", "Isabela", "Kalinga", "La Union", "Laguna", "Lanao del Norte", "Lanao del Sur",
        "Leyte", "Maguindanao", "Marinduque", "Masbate", "Misamis Occidental", "Misamis Oriental",
        "Mountain Province", "Negros Occidental", "Negros Oriental", "Northern Samar", "Nueva Ecija",
        "Nueva Vizcaya", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Pampanga",
        "Pangasinan", "Quezon", "Quirino", "Rizal", "Romblon", "Samar", "Sarangani",
        "Siquijor", "Sorsogon", "South Cotabato", "Southern Leyte", "Sultan Kudarat",
        "Sulu", "Surigao del Norte", "Surigao del Sur", "Tarlac", "Tawi-Tawi", "Zambales",
        "Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay"
      ],
      cities: {}
    },
    "United States": {
      provinces: [
        "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
        "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
        "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
        "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
        "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
        "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
        "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
        "Wisconsin", "Wyoming"
      ],
      cities: {}
    },
    Canada: {
      provinces: [
        "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
        "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
        "Quebec", "Saskatchewan", "Yukon"
      ],
      cities: {}
    }
  };

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

    setAddressesPage(1);
    setOrdersPage(1);
  }, [searchParams]);

  const paginatedAddresses = useMemo(() => {
    const startIndex = (addressesPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return addresses.slice(startIndex, endIndex);
  }, [addresses, addressesPage, itemsPerPage]);

  const addressesTotalPages = Math.ceil(addresses.length / itemsPerPage);

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

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      const data = await orderFunctions.cancelOrder({
        order_id: orderId,
        username: username,
        cancellation_reason: "Cancelled by user"
      });

      if (data.success) {
        setMessage({ text: "Order cancelled successfully", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        fetchOrders();
      } else {
        setMessage({ text: data.message || "Failed to cancel order", type: "error" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.message || error.message || "Something went wrong";
      setMessage({ text: errorMessage, type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } finally {
      setCancellingOrderId(null);
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
      isDefault: false,
      addressType: "home"
    });
    setAutoFilledFields({ province: false, country: false });
    setUseFallbackMode(false);
    setSelectedProvince("");
    setSelectedCityFallback("");
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
      isDefault: address.is_default || false,
      addressType: address.address_type || "home"
    });
    setAutoFilledFields({ province: false, country: false });
    setUseFallbackMode(false);
    setSelectedProvince(address.province || "");
    setSelectedCityFallback("");
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    setDeletingAddressId(id);
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
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handleCitySelect = (locationData) => {
    if (locationData) {
      setFormData((prev) => ({
        ...prev,
        city: locationData.city || prev.city,
        province: locationData.province || prev.province,
        country: locationData.country || prev.country
      }));
      setAutoFilledFields({
        province: !!locationData.province,
        country: !!locationData.country
      });
    }
  };

  const handleClearAutoFill = (field) => {
    if (field === "province") {
      setFormData((prev) => ({ ...prev, province: "" }));
      setAutoFilledFields((prev) => ({ ...prev, province: false }));
    } else if (field === "country") {
      setFormData((prev) => ({ ...prev, country: "Philippines" }));
      setAutoFilledFields((prev) => ({ ...prev, country: false }));
    }
  };

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setFormData((prev) => ({
      ...prev,
      country: newCountry,
      province: "",
      city: ""
    }));
    setSelectedProvince("");
    setSelectedCityFallback("");
  };

  const handleProvinceChange = (e) => {
    const newProvince = e.target.value;
    setSelectedProvince(newProvince);
    setFormData((prev) => ({
      ...prev,
      province: newProvince,
      city: ""
    }));
    setSelectedCityFallback("");
  };

  const handleCityChangeFallback = (e) => {
    const newCity = e.target.value;
    setSelectedCityFallback(newCity);
    setFormData((prev) => ({ ...prev, city: newCity }));
  };

  const handleSubmitAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);

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
        isDefault: formData.isDefault,
        addressType: formData.addressType
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
          isDefault: false,
          addressType: "home"
        });
        setAutoFilledFields({ province: false, country: false });
        setUseFallbackMode(false);
        setSelectedProvince("");
        setSelectedCityFallback("");
        fetchAddresses();
      } else {

        const errorMsg = data.errors 
          ? (Array.isArray(data.errors) ? data.errors.join(", ") : data.errors)
          : (data.message || "Failed to save address");
        setMessage({ text: errorMsg, type: "error" });
        setTimeout(() => setMessage({ text: "", type: "" }), 5000);
      }
    } catch (error) {

      const errorMessage = error.response?.data?.errors 
        ? (Array.isArray(error.response.data.errors) ? error.response.data.errors.join(", ") : error.response.data.errors)
        : (error.response?.data?.message || error.response?.message || error.message || "Something went wrong");
      setMessage({ text: errorMessage, type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1a1a]">
      <Suspense fallback={<div className="w-64 bg-gray-100 dark:bg-gray-800 animate-pulse" />}>
        <UserPortalSidebar />
      </Suspense>

      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/dashboard")}>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Totally Normal</span>
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Store</span>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <nav className="text-sm text-gray-500 dark:text-gray-400">
              <span className="hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer" onClick={() => router.push("/dashboard")}>Home</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 dark:text-gray-100 font-semibold">My Account</span>
            </nav>
          </div>

          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              My Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your shipping addresses and order history
            </p>
          </div>

          {authLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 border-4 border-t-transparent border-blue-500 dark:border-blue-400 rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
              </div>
            </div>
          )}

          {!authLoading && (
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

          {/* Tabs */}
          <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setActiveTab("addresses");
                router.push("/account?tab=addresses");
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === "addresses"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <span>Shipping Addresses</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("orders");
                router.push("/account?tab=orders");
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                activeTab === "orders"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
              }`}
            >
              <FontAwesomeIcon icon={faBox} />
              <span>My Orders</span>
            </button>
            <button
              onClick={() => router.push("/account/settings")}
              className="px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
            >
              <FontAwesomeIcon icon={faCog} />
              <span>Account Settings</span>
            </button>
          </div>

          {activeTab === "addresses" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 px-1">
                  Shipping Addresses
                </h2>
                <button
                  onClick={handleAddAddress}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} />
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

                      {/* Mode Toggle */}
                      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-700">Address Input Mode:</span>
                        <button
                          type="button"
                          onClick={() => setUseFallbackMode(false)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            !useFallbackMode
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          Auto-fill (OpenStreetMap)
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseFallbackMode(true)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            useFallbackMode
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          Manual Dropdowns
                        </button>
                      </div>

                      {!useFallbackMode ? (
                        <>
                          {/* City Autocomplete Mode */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City *
                            </label>
                            <CityAutocomplete
                              value={formData.city}
                              onChange={(value) => setFormData({ ...formData, city: value })}
                              onCitySelect={handleCitySelect}
                              placeholder="Search for a city..."
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Start typing to search for a city. Province and country will auto-fill.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                Province *
                                {autoFilledFields.province && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearAutoFill("province")}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    title="Clear auto-filled value"
                                  >
                                    <FontAwesomeIcon icon={faUndo} className="text-xs" />
                                    Clear
                                  </button>
                                )}
                              </label>
                              <input
                                type="text"
                                value={formData.province}
                                onChange={(e) => {
                                  setFormData({ ...formData, province: e.target.value });
                                  setAutoFilledFields((prev) => ({ ...prev, province: false }));
                                }}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none ${
                                  autoFilledFields.province
                                    ? "border-blue-300 bg-blue-50"
                                    : "border-gray-300"
                                }`}
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                Country *
                                {autoFilledFields.country && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearAutoFill("country")}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    title="Clear auto-filled value"
                                  >
                                    <FontAwesomeIcon icon={faUndo} className="text-xs" />
                                    Clear
                                  </button>
                                )}
                              </label>
                              <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => {
                                  setFormData({ ...formData, country: e.target.value });
                                  setAutoFilledFields((prev) => ({ ...prev, country: false }));
                                }}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none ${
                                  autoFilledFields.country
                                    ? "border-blue-300 bg-blue-50"
                                    : "border-gray-300"
                                }`}
                                required
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Fallback Dropdown Mode */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Country *
                            </label>
                            <select
                              value={formData.country}
                              onChange={handleCountryChange}
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                              required
                            >
                              {Object.keys(countryData).map((country) => (
                                <option key={country} value={country}>
                                  {country}
                                </option>
                              ))}
                              <option value="Other">Other (Manual Entry)</option>
                            </select>
                          </div>

                          {formData.country !== "Other" && countryData[formData.country] && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Province/State *
                              </label>
                              <select
                                value={selectedProvince}
                                onChange={handleProvinceChange}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                required
                              >
                                <option value="">Select Province/State</option>
                                {countryData[formData.country].provinces.map((province) => (
                                  <option key={province} value={province}>
                                    {province}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {(formData.country === "Other" || !countryData[formData.country]) && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Province/State *
                                </label>
                                <input
                                  type="text"
                                  value={formData.province}
                                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  City *
                                </label>
                                <input
                                  type="text"
                                  value={formData.city}
                                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                  required
                                />
                              </div>
                            </>
                          )}

                          {formData.country !== "Other" && countryData[formData.country] && selectedProvince && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City *
                              </label>
                              <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                placeholder="Enter city name"
                                required
                              />
                            </div>
                          )}
                        </>
                      )}

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
                      </div>

                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                            Set as default address
                          </label>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-gray-700">Address Type:</span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="addressType"
                                value="home"
                                checked={formData.addressType === "home"}
                                onChange={(e) => setFormData({ ...formData, addressType: e.target.value })}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <FontAwesomeIcon icon={faHome} className="text-gray-600 text-sm" />
                              <span className="text-sm font-medium text-gray-700">Home</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="addressType"
                                value="work"
                                checked={formData.addressType === "work"}
                                onChange={(e) => setFormData({ ...formData, addressType: e.target.value })}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <FontAwesomeIcon icon={faBriefcase} className="text-gray-600 text-sm" />
                              <span className="text-sm font-medium text-gray-700">Work</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={savingAddress}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingAddress ? (
                            <span className="flex items-center justify-center gap-2">
                              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                              {editingAddress ? "Updating..." : "Adding..."}
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
                          disabled={savingAddress}
                          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {addresses.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sm:p-8 md:p-12 text-center">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-4xl sm:text-5xl md:text-6xl text-gray-300 dark:text-gray-600 mb-4 sm:mb-6" />
                  <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg md:text-xl mb-4 sm:mb-6 px-2">No shipping addresses yet</p>
                  <button
                    onClick={handleAddAddress}
                    className="min-h-[44px] px-5 sm:px-6 md:px-8 py-3 sm:py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2"
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
                      <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2">
                        {address.is_default && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs sm:text-sm font-semibold rounded-full">
                            <FontAwesomeIcon icon={faCheck} className="text-xs" />
                            <span>Default Address</span>
                          </div>
                        )}
                        {address.address_type && (
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-white text-xs sm:text-sm font-semibold rounded-full ${
                            address.address_type === "work" 
                              ? "bg-blue-600" 
                              : "bg-green-600"
                          }`}>
                            <FontAwesomeIcon 
                              icon={address.address_type === "work" ? faBriefcase : faHome} 
                              className="text-xs" 
                            />
                            <span className="capitalize">{address.address_type}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 sm:space-y-4 flex-1 mb-4 sm:mb-6">
                        {/* Full Name */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                            <FontAwesomeIcon icon={faUser} className="text-red-600 text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recipient Name</p>
                            <p className="font-bold text-base sm:text-lg md:text-xl text-gray-800 break-words">{address.full_name}</p>
                          </div>
                        </div>

                        {/* Phone Number */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                            <FontAwesomeIcon icon={faPhone} className="text-blue-600 text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone Number</p>
                            <p className="text-gray-700 text-sm sm:text-base break-words">{address.phone_number}</p>
                          </div>
                        </div>

                        {/* Address Line 1 */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                            <FontAwesomeIcon icon={faHome} className="text-green-600 text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Street Address</p>
                            <p className="text-gray-700 text-sm sm:text-base leading-relaxed break-words">{address.address_line1}</p>
                            {address.address_line2 && (
                              <p className="text-gray-600 text-sm sm:text-base leading-relaxed break-words mt-1">
                                {address.address_line2}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* City, Province, Postal Code */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="text-purple-600 text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                            <div className="space-y-1">
                              <p className="text-gray-700 text-sm sm:text-base">
                                <span className="font-medium">City:</span> {address.city}
                              </p>
                              <p className="text-gray-700 text-sm sm:text-base">
                                <span className="font-medium">Province:</span> {address.province}
                              </p>
                              <p className="text-gray-700 text-sm sm:text-base">
                                <span className="font-medium">Postal Code:</span> {address.postal_code}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Country */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mt-0.5">
                            <FontAwesomeIcon icon={faGlobe} className="text-orange-600 text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Country</p>
                            <p className="text-gray-700 text-sm sm:text-base font-medium">{address.country}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:gap-3 mt-auto pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleEditAddress(address)}
                          disabled={deletingAddressId === address.id}
                          className="min-h-[44px] flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-xs sm:text-sm" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          disabled={deletingAddressId === address.id}
                          className="min-h-[44px] flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingAddressId === address.id ? (
                            <>
                              <FontAwesomeIcon icon={faSpinner} className="text-xs sm:text-sm animate-spin" />
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faTrash} className="text-xs sm:text-sm" />
                              <span>Delete</span>
                            </>
                          )}
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
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6 px-1">
                My Orders
              </h2>

              {orders.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FontAwesomeIcon icon={faBox} className="text-5xl text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    No orders yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Start shopping to see your orders here
                  </p>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <>
                <div className="space-y-6">
                  {paginatedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-6">
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                          {order.id_url ? (
                            <img
                              src={order.id_url || '/placeholder-image.jpg'}
                              alt={order.product_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/placeholder-image.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FontAwesomeIcon icon={faBox} className="text-gray-400 dark:text-gray-500 text-2xl" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-2">
                                {order.product_name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Seller: <span className="font-medium">{order.seller_username}</span>
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Order Date: <span className="font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                              </p>
                            </div>
                            <div className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                              order.status === "pending"
                                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                                : order.status === "shipped"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                                : order.status === "delivered"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                : order.status === "cancelled"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                            }`}>
                              {order.status.toUpperCase()}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
                              <span>
                                Quantity: <span className="font-semibold text-gray-900 dark:text-gray-100">{order.quantity}</span>
                              </span>
                              <span>
                                Unit Price: <span className="font-semibold text-gray-900 dark:text-gray-100">₱{formatPrice(order.price)}</span>
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                              <p className="text-2xl font-bold text-orange-500">
                                ₱{formatPrice(order.total_amount)}
                              </p>
                            </div>
                          </div>
                          {order.status === "pending" && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancellingOrderId === order.id}
                                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {cancellingOrderId === order.id ? (
                                  <>
                                    <FontAwesomeIcon icon={faSpinner} className="text-sm animate-spin" />
                                    <span>Cancelling...</span>
                                  </>
                                ) : (
                                  <>
                                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                                    <span>Cancel Order</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
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
      </main>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#1a1a1a]">
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
