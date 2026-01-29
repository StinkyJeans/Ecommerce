"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { formatPrice } from "@/lib/formatPrice";
import { cartFunctions } from "@/lib/supabase/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTrash } from "@fortawesome/free-solid-svg-icons";
import Navbar from "../components/sellerNavbar";
export default function ViewCart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { username, role, loading: authLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (role && role !== "seller" && role !== "admin") {
      router.push("/");
      return;
    }
    if (!role) {
      router.push("/");
      return;
    }
  }, [username, role, authLoading, router]);
  useEffect(() => {
    if (!username || (role !== "seller" && role !== "admin")) {
      return;
    }
    const fetchCart = async () => {
      try {
        const data = await cartFunctions.getCart(username);
        setCartItems(data.cart || []);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [username]);
  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1a1a]">
      <Navbar />
      <main className="flex-1 p-6 overflow-auto mt-16 md:mt-0">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">🛒 My Cart</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 dark:from-red-500 dark:to-orange-500 dark:hover:from-red-600 dark:hover:to-orange-600 text-white px-4 py-2 rounded-lg transition cursor-pointer shadow-lg hover:shadow-xl"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </button>
        </div>
        {loading ? (
          <p className="text-gray-600 dark:text-gray-400 text-center mt-20">Loading your cart...</p>
        ) : cartItems.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 mt-20">
            <p className="text-lg">Your cart is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {cartItems.map((item) => (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-5 hover:shadow-xl transition relative border border-gray-100 dark:border-gray-700"
              >
                <div className="relative h-48 w-full rounded-lg overflow-hidden mb-4">
                  <img
                    src={item.idUrl || '/placeholder-image.jpg'}
                    alt={item.productName}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ minHeight: '100%', minWidth: '100%' }}
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  {item.productName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {item.description}
                </p>
                <p className="text-red-600 dark:text-red-400 font-bold text-lg mb-4">
                  ₱{formatPrice(item.price)}
                </p>
                <button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 dark:from-red-500 dark:to-orange-500 dark:hover:from-red-600 dark:hover:to-orange-600 text-white py-2 rounded-lg transition cursor-pointer shadow-md hover:shadow-lg">
                  Checkout
                </button>
                <button
                  className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition"
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