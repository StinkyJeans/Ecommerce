"use client";

import Navbar from "../components/navbar";
import { useRouter } from "next/navigation";

export default function Home() {
  const products = [
    { id: 1, name: "Product 1", price: "$19.99" },
    { id: 2, name: "Product 2", price: "$29.99" },
    { id: 3, name: "Product 3", price: "$39.99" },
    { id: 4, name: "Product 4", price: "$49.99" },
  ];

  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <div className="flex h-screen">
      <Navbar />

      <main className="flex-1 p-6 overflow-auto bg-gray-100">
        <div className="flex gap-6 justify-between">
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
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
