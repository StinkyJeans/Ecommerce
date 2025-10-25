"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTrash } from "@fortawesome/free-solid-svg-icons";
import Navbar from "@/app/components/navbar";

export default function ViewCart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { username } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!username) return;
    const fetchCart = async () => {
      try {
        const res = await fetch(`/api/getCart?username=${username}`);
        const data = await res.json();
        setCartItems(data.cart || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [username]);

  const handleRemove = async (itemId) => {
    // Add your remove logic here
    console.log("Remove item:", itemId);
  };

  return (
    <div className="flex min-h-screen">
      <Navbar />

      <main className="flex-1 bg-gray-100 p-4 sm:p-6 lg:p-8 overflow-auto mt-16 md:mt-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">
            My Cart
          </h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm sm:text-base"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-center text-gray-600 mt-20">Loading your cart...</p>
        ) : cartItems.length === 0 ? (
          <p className="text-center text-gray-600 mt-20">Your cart is empty.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-xl shadow-lg p-4 sm:p-5 hover:shadow-xl transition relative"
              >
                <img
                  src={item.idUrl}
                  alt={item.productName}
                  className="h-40 sm:h-48 w-full object-cover rounded-lg mb-4"
                />
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 pr-6">
                  {item.productName}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">
                  {item.description}
                </p>
                <p className="text-red-600 font-bold text-base sm:text-lg mb-4">
                  ₱{item.price}
                </p>

                <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm sm:text-base">
                  Checkout
                </button>

                <button
                  onClick={() => handleRemove(item._id)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition"
                  title="Remove"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-sm sm:text-base" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}