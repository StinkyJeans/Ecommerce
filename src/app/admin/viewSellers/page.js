"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AdminNavbar from "../components/adminNavbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faEnvelope,
  faPhone,
  faCalendar,
  faSpinner,
  faSearch,
  faIdCard,
  faEye,
  faCheckCircle,
  faClock,
  faTimes
} from "@fortawesome/free-solid-svg-icons";

export default function AdminViewSellers() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showIdModal, setShowIdModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!authLoading) {
      if (role !== "admin") {
        router.push("/");
        return;
      }
      fetchSellers();
    }
  }, [role, authLoading, router]);

  useEffect(() => {
    let filtered = sellers;

    if (statusFilter !== "all") {
      filtered = filtered.filter((seller) => seller.seller_status === statusFilter);
    }

    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (seller) =>
          seller.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          seller.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          seller.contact?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSellers(filtered);
  }, [searchTerm, statusFilter, sellers]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/sellers");
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
        console.error("Failed to fetch sellers:", errorData);
        
        if (res.status === 401 || res.status === 403) {
          alert("Access denied. Please make sure you're logged in as an admin.");
          router.push("/");
          return;
        }
        
        alert(`Failed to fetch sellers: ${errorData.message || errorData.error || "Unknown error"}`);
        return;
      }
      
      const data = await res.json();

      if (data.success) {
        setSellers(data.sellers || []);
        setFilteredSellers(data.sellers || []);
      } else {
        console.error("Failed to fetch sellers:", data.message);
        alert(`Failed to fetch sellers: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Failed to fetch sellers:", err);
      alert(`Network error: ${err.message}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
    };
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getStatusIcon = (status) => {
    if (status === "approved") return faCheckCircle;
    if (status === "rejected") return faTimes;
    return faClock;
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
          <p className="text-gray-600 font-medium">Loading sellers...</p>
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return null;
  }

  const statusCounts = {
    all: sellers.length,
    pending: sellers.filter(s => s.seller_status === 'pending').length,
    approved: sellers.filter(s => s.seller_status === 'approved').length,
    rejected: sellers.filter(s => s.seller_status === 'rejected').length,
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
          <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
                  View Sellers
                </h1>
                <p className="text-gray-600">Manage and view all registered sellers</p>
              </div>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                <FontAwesomeIcon icon={faStore} className="text-red-600" />
                <span className="font-semibold text-gray-800">{sellers.length}</span>
                <span className="text-gray-600">Sellers</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by username, email, or contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none bg-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all border ${
                    statusFilter === "all"
                      ? "bg-gradient-to-r from-red-600 to-orange-600 text-white border-transparent"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  All ({statusCounts.all})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all border ${
                    statusFilter === "pending"
                      ? "bg-yellow-500 text-white border-transparent"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Pending ({statusCounts.pending})
                </button>
                <button
                  onClick={() => setStatusFilter("approved")}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all border ${
                    statusFilter === "approved"
                      ? "bg-green-500 text-white border-transparent"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Approved ({statusCounts.approved})
                </button>
                <button
                  onClick={() => setStatusFilter("rejected")}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all border ${
                    statusFilter === "rejected"
                      ? "bg-red-500 text-white border-transparent"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Rejected ({statusCounts.rejected})
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredSellers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <FontAwesomeIcon icon={faStore} className="text-gray-400 text-5xl mb-4" />
              <p className="text-gray-600 text-lg font-semibold">
                {searchTerm || statusFilter !== "all" ? "No sellers found" : "No sellers registered yet"}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : "Sellers will appear here once they register"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSellers.map((seller) => (
                <div key={seller.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {seller.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{seller.username}</h3>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(seller.seller_status)}`}>
                            <FontAwesomeIcon icon={getStatusIcon(seller.seller_status)} className="text-xs" />
                            <span className="capitalize">{seller.seller_status || "pending"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 mt-3">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                          <span className="truncate">{seller.email}</span>
                        </div>
                        {seller.contact && (
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                            <span>{seller.contact}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCalendar} className="text-gray-400" />
                          <span>{new Date(seller.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {seller.id_url && (
                    <div className="mb-4">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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
                <p><strong>Status:</strong> <span className="capitalize">{selectedSeller.seller_status || "pending"}</span></p>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
