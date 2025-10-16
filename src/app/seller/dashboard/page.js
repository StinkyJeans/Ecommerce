"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../components/adminNavbar";

export default function AdminDashboard() {
  const { role, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== "seller") {
      alert("You are not a seller. Access denied.");
      router.push("/");
    }
  }, [role, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (role !== "seller") return null;

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const products = [
    { id: 1, name: "Product 1", price: "$19.99" },
    { id: 2, name: "Product 2", price: "$29.99" },
    { id: 3, name: "Product 3", price: "$39.99" },
    { id: 4, name: "Product 4", price: "$49.99" },
  ];

  return (
    <div className="flex h-screen">
      <Navbar />

      <main className="flex-1 p-6 overflow-auto bg-gray-100">
        <div className="text-3xl font-bold mb-6 text-blue-600 text-center">
          <h1>Seller Dashboard</h1>
        </div>
        <div className="flex justify-between mb-5">
          <h1 className="text-3xl font-bold mb-6 text-red-600">
            Featured Products
          </h1>
          <button
            onClick={handleLogout}
            className="p-5 mb-6 bg-red-600 py-2 rounded text-white hover:bg-red-700 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white shadow-md rounded-lg p-4 hover:shadow-xl transition"
            >
              <div className="h-40 bg-gray-200 rounded mb-4 flex items-center justify-center">
                <span className="text-gray-500">Image</span>
              </div>
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-gray-600">{product.price}</p>
              <button className="mt-3 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition cursor-pointer">
                View
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
