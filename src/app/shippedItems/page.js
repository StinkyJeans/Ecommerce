"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function ShippedItems() {
  const { username } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    fetchOrders();
  }, [username]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/getOrders?username=${username}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Fetch orders failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map(order => (
            <li key={order.id} className="p-4 border rounded-lg shadow-sm">
              <p><strong>Product:</strong> {order.product_name}</p>
              <p><strong>Quantity:</strong> {order.quantity}</p>
              <p><strong>Total:</strong> ₱{parseFloat(order.total_amount).toFixed(2)}</p>
              <p><strong>Status:</strong> {order.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
