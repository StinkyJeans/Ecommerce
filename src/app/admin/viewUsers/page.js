"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AdminNavbar from "../components/adminNavbar";
import Pagination from "@/app/components/Pagination";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { adminFunctions } from "@/lib/supabase/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faEnvelope,
  faPhone,
  faCalendar,
  faSpinner,
  faSearch,
  faUser
} from "@fortawesome/free-solid-svg-icons";

export default function AdminViewUsers() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useLoadingFavicon(authLoading || loading, "View Users");

  useEffect(() => {
    if (!authLoading) {
      if (role !== "admin") {
        router.push("/");
        return;
      }
      fetchUsers();
    }
  }, [role, authLoading, router]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.contact?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    // Reset to first page when search term changes
    setCurrentPage(1);
  }, [searchTerm, users]);

  // Calculate pagination
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminFunctions.getUsers();

      if (data.success) {
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      } else {
        alert(`Failed to fetch users: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      alert(`Network error: ${err.message}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  if (role !== "admin" && !authLoading) {
    return null;
  }

   return (
    <div className="flex min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -left-20 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-40 -right-20 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <AdminNavbar />

      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col overflow-auto">
        {authLoading || loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Loading users...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
              <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
                      View Users
                    </h1>
                    <p className="text-gray-600">Manage and view all registered users</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                    <FontAwesomeIcon icon={faUsers} className="text-red-600" />
                    <span className="font-semibold text-gray-800">{users.length}</span>
                    <span className="text-gray-600">Users</span>
                  </div>
                </div>

            <div className="relative mb-4">
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
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredUsers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <FontAwesomeIcon icon={faUser} className="text-gray-400 text-5xl mb-4" />
              <p className="text-gray-600 text-lg font-semibold">
                {searchTerm ? "No users found" : "No users registered yet"}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm ? "Try a different search term" : "Users will appear here once they register"}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-800">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-700">
                            <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 text-sm" />
                            <span>{user.email || "N/A"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.contact ? (
                            <div className="flex items-center gap-2 text-gray-700">
                              <FontAwesomeIcon icon={faPhone} className="text-gray-400 text-sm" />
                              <span>{user.contact}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-gray-600">
                            <FontAwesomeIcon icon={faCalendar} className="text-gray-400 text-sm" />
                            <span>{new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredUsers.length}
                />
              )}
            </div>
          )}
        </div>
          </>
        )}
      </main>
    </div>
  );
}
