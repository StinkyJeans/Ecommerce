  "use client";

  import { useEffect, useState } from "react";
  import Navbar from "../components/sellerNavbar";

  export default function SellerOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [sellerUsername, setSellerUsername] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const storedUser = localStorage.getItem("username");
      if (storedUser) {
        setSellerUsername(storedUser);
        fetchOrders(storedUser);
      }
    }, []);

    async function fetchOrders(sellerUsername) {
      try {
        const res = await fetch(`/api/orders/seller/${sellerUsername}`);
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    }

    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
        <Navbar />

        <main className="flex-1 relative mt-16 md:mt-0 flex flex-col px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Orders</h1>

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="h-20 w-20 border-4 border-red-200 rounded-full mx-auto"></div>
                  <div className="h-20 w-20 border-4 border-t-red-600 rounded-full animate-spin absolute top-0 left-1/2 -translate-x-1/2"></div>
                </div>
                <p className="text-gray-700 font-semibold text-lg">Loading Orders...</p>
                <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md border border-gray-100">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-box-open text-4xl text-red-500"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No Orders Found</h3>
                <p className="text-gray-600 leading-relaxed">
                  Orders will appear here once customers place them.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200"
                >
                  <div className="p-5 flex flex-col justify-between h-full">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors truncate">
                        {order.productName}
                      </h2>
                      <p className="text-sm text-gray-500 mb-1">
                        Buyer: <span className="text-gray-700">{order.username}</span>
                      </p>
                      <p className="text-sm text-gray-500 mb-1">
                        Quantity: <span className="text-gray-700">{order.quantity}</span>
                      </p>
                      <p className="text-sm text-gray-500 mb-1">
                        Total: <span className="text-gray-700">₱{order.totalAmount}</span>
                      </p>
                      <p className="text-sm text-gray-500 mb-1 capitalize">
                        Status: <span className="text-gray-700">{order.status}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Date: <span className="text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>

                    <button
                      className="mt-4 cursor-pointer w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-info-circle"></i>View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }
