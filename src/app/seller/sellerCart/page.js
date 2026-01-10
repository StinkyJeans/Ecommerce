"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTrash } from "@fortawesome/free-solid-svg-icons";
import Navbar from "../components/sellerNavbar";


export default function ViewCart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { username, role, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!username || (role !== "seller" && role !== "admin")) {
        router.push("/");
        return;
      }
    }
  }, [username, role, authLoading, router]);

  useEffect(() => {
    if (!username || (role !== "seller" && role !== "admin")) {
      return;
    }

    const fetchCart = async () => {
      try {
        const res = await fetch(`/api/getCart?username=${username}`);
        const data = await res.json();
        setCartItems(data.cart || []);
      } catch (err) {
        console.error("Failed to fetch cart:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [username]);


  return (
    <div className="flex h-screen">
      <Navbar />
      <main className="flex-1 bg-gray-100 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-red-600">🛒 My Cart</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600 text-center mt-20">Loading your cart...</p>
        ) : cartItems.length === 0 ? (
          <div className="text-center text-gray-600 mt-20">
            <p className="text-lg">Your cart is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="bg-white shadow-lg rounded-xl p-5 hover:shadow-xl transition relative"
              >
                <div className="relative h-48 w-full rounded-lg overflow-hidden mb-4">
                  <img
                    src={item.idUrl}
                    alt={item.productName}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ minHeight: '100%', minWidth: '100%' }}
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {item.productName}
                </h2>
                <p className="text-gray-600 mb-2 line-clamp-2">
                  {item.description}
                </p>
                <p className="text-red-600 font-bold text-lg mb-4">
                  ₱{item.price}
                </p>

                <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition cursor-pointer">
                  Checkout
                </button>

                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
                  title="Remove item"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
