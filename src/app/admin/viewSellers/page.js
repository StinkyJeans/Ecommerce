"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AdminNavbar from "../components/adminNavbar";
import Pagination from "@/app/components/Pagination";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { adminFunctions } from "@/lib/supabase/api";
import { getImageUrl } from "@/lib/supabase/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStore,
  faEnvelope,
  faPhone,
  faCalendar,
  faSpinner,
  faSearch,
  faFileAlt,
  faEye,
  faCheckCircle,
  faTimes,
  faFilter,
  faChevronLeft,
  faChevronRight
} from "@fortawesome/free-solid-svg-icons";

export default function AdminViewSellers() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useLoadingFavicon(authLoading || loading, "Seller Approvals");

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
      if (statusFilter === "pending") {
        filtered = filtered.filter((seller) => seller.seller_status === 'pending' || seller.seller_status === null);
      } else {
        filtered = filtered.filter((seller) => seller.seller_status === statusFilter);
      }
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
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sellers]);

  const paginatedSellers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSellers.slice(startIndex, endIndex);
  }, [filteredSellers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const data = await adminFunctions.getSellers();

      if (data.success) {
        setSellers(data.sellers || []);
        setFilteredSellers(data.sellers || []);
      } else {
        alert(`Failed to fetch sellers: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId) => {
    // TODO: Implement approve functionality
    console.log("Approve seller:", sellerId);
  };

  const handleReject = async (sellerId) => {
    // TODO: Implement reject functionality
    console.log("Reject seller:", sellerId);
  };

  const openApplicationDetails = (seller) => {
    setSelectedSeller(seller);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedSeller(null);
  };

  if (role !== "admin" && !authLoading) {
    return null;
  }

  const statusCounts = {
    all: sellers.length,
    pending: sellers.filter(s => s.seller_status === 'pending' || s.seller_status === null).length,
    approved: sellers.filter(s => s.seller_status === 'approved').length,
    rejected: sellers.filter(s => s.seller_status === 'rejected').length,
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1a1a]">
      <AdminNavbar />

      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col overflow-auto">
        {authLoading || loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 border-4 border-t-transparent border-orange-500 dark:border-orange-400 rounded-full animate-spin"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading sellers...</p>
            </div>
          </div>
        ) : (
          <div className="p-8">
            {/* Breadcrumbs */}
            <div className="mb-4">
              <nav className="text-sm text-gray-500 dark:text-gray-400">
                <span>Admin Portal</span>
                <span className="mx-2">/</span>
                <span>Seller Management</span>
                <span className="mx-2">/</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">Approvals</span>
              </nav>
            </div>

            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Seller Approval Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Review and manage pending seller registration requests to maintain marketplace quality.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faSearch} className="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search by applicant or store name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                    statusFilter === "pending"
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter("approved")}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                    statusFilter === "approved"
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Approved
                </button>
                <button
                  onClick={() => setStatusFilter("rejected")}
                  className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                    statusFilter === "rejected"
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  Rejected
                </button>
                <button
                  className="px-5 py-2.5 rounded-xl font-semibold transition-all bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faFilter} className="text-sm" />
                  More Filters
                </button>
              </div>
            </div>

            {/* Table */}
            {filteredSellers.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
                <FontAwesomeIcon icon={faStore} className="text-gray-400 dark:text-gray-500 text-5xl mb-4" />
                <p className="text-gray-600 dark:text-gray-300 text-lg font-semibold">
                  {searchTerm || statusFilter !== "all" ? "No sellers found" : "No sellers registered yet"}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  {searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : "Sellers will appear here once they register"}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <div className="col-span-3">APPLICANT</div>
                    <div className="col-span-2">STORE NAME</div>
                    <div className="col-span-2">APPLICATION DATE</div>
                    <div className="col-span-2">DOCUMENTS</div>
                    <div className="col-span-3">ACTIONS</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedSellers.map((seller) => (
                    <div key={seller.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* APPLICANT */}
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-white font-semibold">
                            {seller.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{seller.username}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{seller.email}</p>
                          </div>
                        </div>

                        {/* STORE NAME */}
                        <div className="col-span-2">
                          <p className="text-gray-900 dark:text-gray-100">{seller.username}'s Store</p>
                        </div>

                        {/* APPLICATION DATE */}
                        <div className="col-span-2">
                          <p className="text-gray-700 dark:text-gray-300">
                            {new Date(seller.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>

                        {/* DOCUMENTS */}
                        <div className="col-span-2">
                          {seller.id_url ? (
                            <button
                              onClick={() => openApplicationDetails(seller)}
                              className="flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors font-medium"
                            >
                              <FontAwesomeIcon icon={faFileAlt} />
                              <span className="text-sm">View Docs</span>
                            </button>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-sm">No documents</span>
                          )}
                        </div>

                        {/* ACTIONS */}
                        <div className="col-span-3 flex items-center gap-2">
                          <button
                            onClick={() => openApplicationDetails(seller)}
                            className="px-3 py-2 flex items-center gap-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <FontAwesomeIcon icon={faEye} />
                            View Details
                          </button>
                          <button
                            onClick={() => handleApprove(seller.id)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm hover:shadow-md"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(seller.id)}
                            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{paginatedSellers.length}</span> of{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{statusCounts.pending}</span> pending applications
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-xl font-semibold transition-all min-w-[40px] ${
                        currentPage === page
                          ? "bg-orange-500 text-white shadow-md"
                          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Application Details Modal */}
      {showDetailsModal && selectedSeller && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto relative shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Application Details</h2>
              <button
                onClick={closeDetailsModal}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faTimes} className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Applicant */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Applicant</h3>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedSeller.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">{selectedSeller.username}</p>
                    <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <FontAwesomeIcon icon={faEnvelope} className="text-orange-500 w-4" />
                      {selectedSeller.email}
                    </p>
                    {selectedSeller.contact && (
                      <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <FontAwesomeIcon icon={faPhone} className="text-orange-500 w-4" />
                        {selectedSeller.contact}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Store & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Store Name</h3>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedSeller.username}'s Store</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Application Date</h3>
                  <p className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendar} className="text-orange-500" />
                    {new Date(selectedSeller.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Status</h3>
                <span className={`inline-flex px-4 py-2 rounded-xl text-sm font-semibold capitalize ${
                  (selectedSeller.seller_status || 'pending') === 'approved'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : (selectedSeller.seller_status || 'pending') === 'rejected'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {selectedSeller.seller_status || 'pending'}
                </span>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileAlt} className="text-orange-500" />
                  ID / Business Document
                </h3>
                {selectedSeller.id_url ? (
                  <div className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                    <img
                      src={getImageUrl(selectedSeller.id_url, 'seller-ids') || selectedSeller.id_url}
                      alt="ID Document"
                      className="w-full h-auto max-h-[40vh] object-contain"
                      onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
                    />
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm py-4">No document uploaded</p>
                )}
              </div>

              {/* Actions */}
              {(selectedSeller.seller_status === 'pending' || selectedSeller.seller_status == null) && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => { handleApprove(selectedSeller.id); closeDetailsModal(); }}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Approve
                  </button>
                  <button
                    onClick={() => { handleReject(selectedSeller.id); closeDetailsModal(); }}
                    className="flex-1 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    Reject
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
