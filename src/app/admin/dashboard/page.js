"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AdminNavbar from "../components/adminNavbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faStore,
  faBoxes,
  faChartLine,
  faEye,
  faCheckCircle,
  faTimes,
  faSpinner,
  faIdCard,
  faEnvelope,
  faPhone,
  faCalendar,
  faGlobe,
  faUserCheck,
  faClock
} from "@fortawesome/free-solid-svg-icons";

export default function AdminDashboard() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showIdModal, setShowIdModal] = useState(false);
  const [processingSeller, setProcessingSeller] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    if (!authLoading) {
      if (role !== "admin") {
        router.push("/");
        return;
      }
      fetchData();
    }
  }, [role, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, sellersRes] = await Promise.all([
        fetch("/api/admin/statistics"),
        fetch("/api/admin/pendingSellers")
      ]);

      const statsData = await statsRes.json();
      const sellersData = await sellersRes.json();

      if (statsData.success) {
        setStatistics(statsData.statistics);
      }

      if (sellersData.success) {
        setPendingSellers(sellersData.pendingSellers || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setMessage({ text: "Failed to load dashboard data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (sellerId, action) => {
    setProcessingSeller(sellerId);
    try {
      const res = await fetch("/api/admin/approveSeller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, action }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ 
          text: `Seller ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 
          type: "success" 
        });
        // Remove from pending list
        setPendingSellers(prev => prev.filter(s => s.id !== sellerId));
        // Refresh statistics
        fetchData();
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: data.message || "Operation failed", type: "error" });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    } catch (err) {
      console.error("Error processing seller:", err);
      setMessage({ text: "Failed to process request", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } finally {
      setProcessingSeller(null);
    }
  };

  const viewIdPicture = (seller) => {
    setSelectedSeller(seller);
    setShowIdModal(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return null;
  }

  const stats = statistics || {
    users: { total: 0, sellers: { total: 0, approved: 0, pending: 0 } },
    products: { total: 0 },
    visits: { total: 0, uniqueLast30Days: 0, dailyLast30Days: [], pageViews: {} }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -left-20 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-40 -right-20 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <AdminNavbar />

      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col overflow-auto">
        <div className="z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-1 sm:mb-2">
              Admin Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Manage sellers, view statistics, and monitor website activity</p>
          </div>
        </div>

        {message.text && (
          <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-4 z-50 px-4 py-3 rounded-lg shadow-lg max-w-sm sm:max-w-md mx-auto sm:mx-0 ${
            message.type === "success" 
              ? "bg-green-500 text-white" 
              : "bg-red-500 text-white"
          }`}>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={message.type === "success" ? faCheckCircle : faTimes} className="flex-shrink-0" />
              <span className="text-sm sm:text-base break-words">{message.text}</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faUsers} className="text-white text-lg sm:text-xl" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{stats.users.total}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Users</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faStore} className="text-white text-lg sm:text-xl" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{stats.users.sellers.total}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Sellers</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faBoxes} className="text-white text-lg sm:text-xl" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{stats.products.total}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Products</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faGlobe} className="text-white text-lg sm:text-xl" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{stats.visits.total}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Visits</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faClock} className="text-white text-lg sm:text-xl" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{stats.users.sellers.pending}</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Pending Sellers</p>
            </div>
          </div>

          {/* Pending Sellers Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Pending Seller Approvals</h2>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs sm:text-sm font-semibold self-start sm:self-auto">
                {pendingSellers.length} Pending
              </span>
            </div>

            {pendingSellers.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-5xl mb-4" />
                <p className="text-gray-600 text-lg">No pending sellers</p>
                <p className="text-gray-500 text-sm mt-2">All sellers have been reviewed</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingSellers.map((seller) => (
                  <div key={seller.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-800 mb-1 truncate">{seller.username}</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">{seller.email}</span>
                          </div>
                          {seller.contact && (
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faPhone} className="text-gray-400 flex-shrink-0" />
                              <span className="truncate">{seller.contact}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendar} className="text-gray-400 flex-shrink-0" />
                            <span>{new Date(seller.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {seller.id_url && (
                      <div className="mb-4 flex-shrink-0">
                        <button
                          onClick={() => viewIdPicture(seller)}
                          className="w-full relative group"
                        >
                          <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-red-400 transition-colors">
                            <img
                              src={seller.id_url}
                              alt="ID Preview"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                                  <FontAwesomeIcon icon={faEye} className="text-red-600 text-xl" />
                                </div>
                                <p className="text-white text-sm mt-2 font-medium">View ID</p>
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2 mt-auto pt-2">
                      <button
                        onClick={() => handleApproveReject(seller.id, "approve")}
                        disabled={processingSeller === seller.id}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2.5 px-2 sm:px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base min-w-0"
                      >
                        {processingSeller === seller.id ? (
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faCheckCircle} className="flex-shrink-0" />
                            <span className="truncate">Approve</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleApproveReject(seller.id, "reject")}
                        disabled={processingSeller === seller.id}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2.5 px-2 sm:px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base min-w-0"
                      >
                        {processingSeller === seller.id ? (
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faTimes} className="flex-shrink-0" />
                            <span className="truncate">Reject</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visit Statistics Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Visit Statistics (Last 30 Days)</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <FontAwesomeIcon icon={faUserCheck} className="text-blue-600 text-lg sm:text-xl" />
                  <h3 className="font-semibold text-sm sm:text-base text-gray-800">Unique Visitors</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.visits.uniqueLast30Days}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <FontAwesomeIcon icon={faChartLine} className="text-green-600 text-lg sm:text-xl" />
                  <h3 className="font-semibold text-sm sm:text-base text-gray-800">Total Visits</h3>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.visits.total}</p>
              </div>
            </div>

            {stats.visits.dailyLast30Days.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <h3 className="font-semibold text-sm sm:text-base text-gray-800 mb-3 sm:mb-4">Daily Visits Trend</h3>
                <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                  {stats.visits.dailyLast30Days.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                      <span className="text-xs sm:text-sm text-gray-600 truncate flex-1 mr-2">{day.date}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-20 sm:w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-red-500 to-orange-600 h-2 rounded-full"
                            style={{ width: `${Math.min((day.count / Math.max(...stats.visits.dailyLast30Days.map(d => d.count))) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-gray-800 w-10 sm:w-12 text-right">{day.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(stats.visits.pageViews).length > 0 && (
              <div className="mt-4 sm:mt-6">
                <h3 className="font-semibold text-sm sm:text-base text-gray-800 mb-3 sm:mb-4">Page Views</h3>
                <div className="space-y-2">
                  {Object.entries(stats.visits.pageViews)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([page, count]) => (
                      <div key={page} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg gap-2">
                        <span className="text-xs sm:text-sm text-gray-700 font-mono truncate flex-1">{page}</span>
                        <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs sm:text-sm font-semibold flex-shrink-0">
                          {count} views
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ID Picture Modal */}
      {showIdModal && selectedSeller && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-auto relative m-2 sm:m-0 shadow-2xl">
            <button
              onClick={() => {
                setShowIdModal(false);
                setSelectedSeller(null);
              }}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
            >
              <FontAwesomeIcon icon={faTimes} className="text-gray-600 text-sm sm:text-base" />
            </button>
            <div className="p-4 sm:p-5">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">ID Verification - {selectedSeller.username}</h3>
              <div className="mb-3 space-y-1.5 text-xs sm:text-sm text-gray-600">
                <p><strong>Email:</strong> <span className="break-words">{selectedSeller.email}</span></p>
                {selectedSeller.contact && <p><strong>Contact:</strong> {selectedSeller.contact}</p>}
                <p><strong>Registered:</strong> {new Date(selectedSeller.created_at).toLocaleString()}</p>
              </div>
              {selectedSeller.id_url && (
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden mb-4">
                  <img
                    src={selectedSeller.id_url}
                    alt="ID Document"
                    className="w-full h-auto max-h-[50vh] object-contain"
                  />
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
                <button
                  onClick={() => {
                    handleApproveReject(selectedSeller.id, "approve");
                    setShowIdModal(false);
                  }}
                  disabled={processingSeller === selectedSeller.id}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2.5 px-3 sm:px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {processingSeller === selectedSeller.id ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Approve Seller</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    handleApproveReject(selectedSeller.id, "reject");
                    setShowIdModal(false);
                  }}
                  disabled={processingSeller === selectedSeller.id}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2.5 px-3 sm:px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {processingSeller === selectedSeller.id ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faTimes} />
                      <span>Reject Seller</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
