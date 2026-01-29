"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { formatPrice } from "@/lib/formatPrice";
import { sellerOrderFunctions } from "@/lib/supabase/api";
import { getImageUrl } from "@/lib/supabase/storage";
import Header from "@/app/components/header";
import Navbar from "../components/sellerNavbar";
import Pagination from "@/app/components/Pagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faSpinner,
  faCheckCircle,
  faTruck,
  faTimes,
  faEdit,
  faFilter,
  faSearch,
  faCalendar,
  faUser,
  faTag,
  faBarcode
} from "@fortawesome/free-solid-svg-icons";

export default function SellerOrders() {
  const router = useRouter();
  const { username, role, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useLoadingFavicon(authLoading || loading, "My Orders");

  useEffect(() => {
    if (!authLoading) {
      if (role !== "seller" && role !== "admin") {
        router.push("/");
        return;
      }
      fetchOrders();
    }
  }, [role, authLoading, router, statusFilter]);

  useEffect(() => {
    if (!username) return;
    fetchOrders();
  }, [username, statusFilter]);

  useEffect(() => {
    let filtered = orders;
    
    if (searchTerm.trim()) {
      filtered = filtered.filter(order =>
        order.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [orders, searchTerm]);

  const fetchOrders = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const data = await sellerOrderFunctions.getSellerOrders(username, statusFilter);
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      setOrders([]);
      setMessage({ text: "Failed to load orders", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    setUpdating(true);
    try {
      const data = await sellerOrderFunctions.updateOrderStatus({
        order_id: selectedOrder.id,
        status: newStatus,
        tracking_number: trackingNumber || null
      });
      
      if (data.success) {
        setMessage({ text: "Order status updated successfully", type: "success" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        setShowStatusModal(false);
        setSelectedOrder(null);
        setNewStatus("");
        setTrackingNumber("");
        fetchOrders();
      } else {
        setMessage({ text: data.message || "Failed to update order status", type: "error" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (error) {
      setMessage({ text: "Failed to update order status", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.tracking_number || "");
    setShowStatusModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
      case "confirmed":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "shipped":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300";
      case "delivered":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
    }
  };

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a] flex">
      <Navbar />
      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col">
        <div className="z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <Header />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl w-full">
            <div className="mb-4 sm:mb-6 md:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent px-1">
                My Orders
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base mt-2 sm:mt-3 px-1">
                Manage and track orders for your products
              </p>
            </div>

            {message.text && (
              <div className={`mb-4 sm:mb-6 p-4 sm:p-5 rounded-lg ${
                message.type === "success" 
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800" 
                  : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
              }`}>
                <div className="flex items-start gap-2 sm:gap-3">
                  <FontAwesomeIcon 
                    icon={message.type === "success" ? faCheckCircle : faTimes} 
                    className="text-base sm:text-lg mt-0.5 flex-shrink-0"
                  />
                  <span className="font-medium text-sm sm:text-base">{message.text}</span>
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Status Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FontAwesomeIcon icon={faFilter} className="mr-2" />
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Search */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <FontAwesomeIcon icon={faSearch} className="mr-2" />
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search by product, customer, or tracking..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 border-4 border-t-transparent border-red-600 dark:border-red-400 rounded-full animate-spin"></div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Loading orders...</p>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sm:p-8 md:p-12 text-center border border-gray-200 dark:border-gray-700">
                <FontAwesomeIcon icon={faBox} className="text-4xl sm:text-5xl md:text-6xl text-gray-300 dark:text-gray-600 mb-4 sm:mb-6" />
                <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg md:text-xl mb-4 sm:mb-6 px-2">
                  {orders.length === 0 ? "No orders yet" : "No orders match your filters"}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {paginatedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-5 md:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0 relative">
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
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                                  <FontAwesomeIcon icon={faBox} className="text-gray-400 dark:text-gray-500 text-xl sm:text-2xl" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                              <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-800 dark:text-gray-200 line-clamp-2">
                                {order.product_name}
                              </h3>
                              <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                <span>
                                  <FontAwesomeIcon icon={faUser} className="mr-1" />
                                  Customer: <span className="font-medium">{order.username}</span>
                                </span>
                                <span>
                                  <FontAwesomeIcon icon={faTag} className="mr-1" />
                                  Quantity: <span className="font-semibold">{order.quantity}</span>
                                </span>
                                <span>
                                  <FontAwesomeIcon icon={faCalendar} className="mr-1" />
                                  {new Date(order.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {order.tracking_number && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  <FontAwesomeIcon icon={faBarcode} />
                                  <span>Tracking: <span className="font-mono font-semibold">{order.tracking_number}</span></span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 md:gap-3">
                          <div className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${getStatusColor(order.status)}`}>
                            {order.status.toUpperCase()}
                          </div>
                          <div className="text-right sm:text-left">
                            <p className="text-base sm:text-lg md:text-xl font-bold text-red-600 dark:text-red-400 mb-1">
                              ₱{formatPrice(order.total_amount)}
                            </p>
                            <button
                              onClick={() => openStatusModal(order)}
                              className="mt-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 dark:from-red-500 dark:to-orange-500 dark:hover:from-red-600 dark:hover:to-orange-600 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center gap-2"
                            >
                              <FontAwesomeIcon icon={faEdit} className="text-xs" />
                              Update Status
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      itemsPerPage={itemsPerPage}
                      totalItems={filteredOrders.length}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Status Update Modal */}
        {showStatusModal && selectedOrder && (
          <div 
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowStatusModal(false);
                setSelectedOrder(null);
              }
            }}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  Update Order Status
                </h3>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Product</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedOrder.product_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order Status *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {newStatus === 'shipped' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating || !newStatus}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 dark:from-red-500 dark:to-red-600 dark:hover:from-red-600 dark:hover:to-red-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <span className="flex items-center justify-center gap-2">
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      "Update Status"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowStatusModal(false);
                      setSelectedOrder(null);
                    }}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
