"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/formatPrice";
import { orderFunctions } from "@/lib/supabase/api";
import Pagination from "@/app/components/Pagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBox, faSpinner, faTimes } from "@fortawesome/free-solid-svg-icons";

const ITEMS_PER_PAGE = 10;

export default function AccountOrdersSection({ username, setMessage }) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const fetchOrders = async () => {
    if (!username) return;
    try {
      const data = await orderFunctions.getOrders(username);
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    if (username) fetchOrders();
  }, [username]);

  const paginatedOrders = useMemo(() => {
    const start = (ordersPage - 1) * ITEMS_PER_PAGE;
    return orders.slice(start, start + ITEMS_PER_PAGE);
  }, [orders, ordersPage]);

  const ordersTotalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancellingOrderId(orderId);
    try {
      const data = await orderFunctions.cancelOrder({
        order_id: orderId,
        username,
        cancellation_reason: "Cancelled by user",
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
      const msg = error.response?.message || error.message || "Something went wrong";
      setMessage({ text: msg, type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } finally {
      setCancellingOrderId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6 px-1">
        My Orders
      </h2>
      {orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faBox} className="text-5xl text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No orders yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Start shopping to see your orders here</p>
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
                        src={order.id_url || "/placeholder-image.jpg"}
                        alt={order.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = "/placeholder-image.jpg"; }}
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
                        <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-2">{order.product_name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Seller: <span className="font-medium">{order.seller_username}</span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Order Date: <span className="font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                      <div
                        className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                          order.status === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                            : order.status === "shipped"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            : order.status === "delivered"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : order.status === "cancelled"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {order.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <span>Quantity: <span className="font-semibold text-gray-900 dark:text-gray-100">{order.quantity}</span></span>
                        <span>Unit Price: <span className="font-semibold text-gray-900 dark:text-gray-100">₱{formatPrice(order.price)}</span></span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-orange-500">₱{formatPrice(order.total_amount)}</p>
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
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={orders.length}
            />
          )}
        </>
      )}
    </div>
  );
}