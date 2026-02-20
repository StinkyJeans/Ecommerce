"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { formatPrice } from "@/lib/formatPrice";
import { sellerOrderFunctions } from "@/lib/supabase/api";
import { getFirstImageUrl } from "@/lib/supabase/storage";
import { useSellerOrderRealtime } from "@/app/hooks/useSellerOrderRealtime";
import Navbar from "../components/sellerNavbar";
import {
  PlusCircle,
  Package,
  ChartLine,
  ShoppingBasket,
  RefreshCw,
  Star,
  ConciergeBell as Bell,
} from "griddy-icons";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
function getLast7DayLabels() {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(DAY_LABELS[d.getDay()]);
  }
  return labels;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function SellerDashboard() {
  const router = useRouter();
  const { username, role, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderNotificationCount, setOrderNotificationCount] = useState(0);
  const [orderNotificationList, setOrderNotificationList] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);

  useLoadingFavicon(authLoading || loading, "Seller Dashboard");

  useEffect(() => {
    if (authLoading) return;
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
    if (!username || (role !== "seller" && role !== "admin")) return;
    let cancelled = false;
    sellerOrderFunctions.getSellerOrders("all")
      .then((r) => {
        if (!cancelled) setOrders(r.orders || []);
      })
      .catch(() => { if (!cancelled) setOrders([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username, role]);

  const fetchOrderNotifications = () => {
    if (!username) return;
    setLoadingNotifications(true);
    sellerOrderFunctions.getSellerOrderNotifications()
      .then((data) => {
        setOrderNotificationCount(data?.count ?? 0);
        setOrderNotificationList(data?.orders ?? []);
      })
      .catch(() => {
        setOrderNotificationCount(0);
        setOrderNotificationList([]);
      })
      .finally(() => setLoadingNotifications(false));
  };

  useEffect(() => {
    if (!username) return;
    fetchOrderNotifications();
    const interval = setInterval(fetchOrderNotifications, 60000);
    return () => clearInterval(interval);
  }, [username]);

  useSellerOrderRealtime(username, () => {
    fetchOrderNotifications();
  }, !!(username && (role === "seller" || role === "admin")));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) setShowNotificationDropdown(false);
    };
    if (showNotificationDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotificationDropdown]);

  const displayName = username ? username.charAt(0).toUpperCase() + username.slice(1).toLowerCase() : "";

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const dailyRevenue = useMemo(() => {
    return orders
      .filter((o) => new Date(o.created_at).getTime() >= todayStart && o.status !== "cancelled")
      .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  }, [orders, todayStart]);

  const ordersToShip = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
    const urgent = orders.filter((o) => o.status === "pending");
    return { count: pending.length, urgent: urgent.length };
  }, [orders]);

  const last7DaysRevenue = useMemo(() => {
    const result = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStart = now.getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      const t = new Date(o.created_at);
      t.setHours(0, 0, 0, 0);
      const dayStart = t.getTime();
      const daysAgo = Math.round((todayStart - dayStart) / oneDay);
      if (daysAgo >= 0 && daysAgo < 7) {
        result[6 - daysAgo] += parseFloat(o.total_amount) || 0;
      }
    }
    return result;
  }, [orders]);

  const totalPeriodEarnings = useMemo(() => last7DaysRevenue.reduce((a, b) => a + b, 0), [last7DaysRevenue]);
  const maxDayRevenue = Math.max(1, ...last7DaysRevenue);

  const topProducts = useMemo(() => {
    const byProduct = {};
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      const id = o.product_id;
      if (!byProduct[id]) {
        byProduct[id] = { product_name: o.product_name, id_url: o.id_url, quantity: 0, revenue: 0 };
      }
      byProduct[id].quantity += parseInt(o.quantity, 10) || 0;
      byProduct[id].revenue += parseFloat(o.total_amount) || 0;
    }
    return Object.entries(byProduct)
      .map(([id, v]) => ({ product_id: id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const recentActivity = useMemo(() => {
    return orders
      .filter((o) => o.status !== "cancelled")
      .slice(0, 8)
      .map((o) => ({
        id: o.id,
        type: "order",
        title: `New Order #ORD-${String(o.id).slice(-4)}`,
        detail: `${o.quantity} item(s) · ₱${formatPrice(o.total_amount)}`,
        time: o.created_at,
      }));
  }, [orders]);

  if (authLoading || !username) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 mt-16 md:mt-0 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F8F8]">
      <Navbar />
      <main className="flex-1 relative mt-16 md:mt-0 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {getGreeting()}, {displayName}
              </h1>
              <p className="text-gray-600 mt-1">Here&apos;s what&apos;s happening with your store today.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={() => { setShowNotificationDropdown((v) => !v); if (!showNotificationDropdown) fetchOrderNotifications(); }}
                  className="relative p-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  aria-label="Order notifications"
                >
                  <Bell size={22} className="text-gray-700" />
                  {orderNotificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                      {orderNotificationCount > 99 ? "99+" : orderNotificationCount}
                    </span>
                  )}
                </button>
                {showNotificationDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-80 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                    <div className="px-3 pb-2 border-b border-gray-200 flex items-center justify-between">
                      <span className="font-semibold text-gray-900">New orders</span>
                      <button type="button" onClick={() => { setShowNotificationDropdown(false); router.push("/seller/orders"); }} className="text-sm text-orange-600 hover:underline">View all</button>
                    </div>
                    {loadingNotifications ? (
                      <div className="p-4 flex justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
                    ) : orderNotificationList.length === 0 ? (
                      <p className="p-4 text-sm text-gray-500">No new orders</p>
                    ) : (
                      <ul className="py-1">
                        {orderNotificationList.map((o) => (
                          <li key={o.id} className="px-3 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => { setShowNotificationDropdown(false); router.push("/seller/orders"); }}>
                            <p className="text-sm font-medium text-gray-900 truncate">{o.product_name}</p>
                            <p className="text-xs text-gray-500">₱{Number(o.total_amount).toLocaleString()} · {o.created_at ? formatRelativeTime(o.created_at) : ""}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => router.push("/seller/addProduct")}
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
              >
                <PlusCircle size={18} />
                New Product
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative">
                  <div className="absolute top-4 right-4 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ChartLine size={20} className="text-orange-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Daily Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₱{formatPrice(dailyRevenue)}</p>
                  <p className="text-sm text-green-600 mt-1">+12% from yesterday</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative">
                  <div className="absolute top-4 right-4 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Package size={20} className="text-orange-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Orders to Ship</p>
                  <p className="text-2xl font-bold text-gray-900">{ordersToShip.count}</p>
                  {ordersToShip.urgent > 0 && (
                    <p className="text-sm text-gray-500 mt-1">{ordersToShip.urgent} urgent orders</p>
                  )}
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative">
                  <div className="absolute top-4 right-4 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Star size={20} className="text-amber-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">4.8/5</p>
                  <p className="text-sm text-gray-500 mt-1">Based on 2.4k reviews</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 relative">
                  <div className="absolute top-4 right-4 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <ChartLine size={20} className="text-amber-600" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Store Views</p>
                  <p className="text-2xl font-bold text-gray-900">15,204</p>
                  <p className="text-sm text-green-600 mt-1">+5.2% this week</p>
                </div>
              </div>

              {/* Sales Performance */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Sales Performance</h2>
                    <p className="text-sm text-gray-500">Revenue overview over the last 7 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">₱{formatPrice(totalPeriodEarnings)}</p>
                    <p className="text-xs text-gray-500">Total Period Earnings</p>
                  </div>
                </div>
                <div className="flex items-end gap-2 h-40">
                  {last7DaysRevenue.map((rev, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-orange-500 to-amber-400 transition-all"
                        style={{ height: `${(rev / maxDayRevenue) * 100}%`, minHeight: rev > 0 ? "8px" : "0" }}
                      />
                      <span className="text-xs font-medium text-gray-500">{getLast7DayLabels()[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom row: Top Selling + Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Top Selling Products</h2>
                    <button
                      onClick={() => router.push("/seller/viewProduct")}
                      className="text-sm font-medium text-orange-600 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  {topProducts.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">No sales yet.</p>
                  ) : (
                    <ul className="space-y-4">
                      {topProducts.map((p) => (
                        <li key={p.product_id} className="flex gap-4">
                          <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {p.id_url ? (
                              <img
                                src={getFirstImageUrl(p.id_url)}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%23e5e5e5' width='1' height='1'/%3E%3C/svg%3E";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={24} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{p.product_name}</p>
                            <p className="text-sm text-gray-500">{p.quantity} sold</p>
                          </div>
                          <p className="text-sm font-semibold text-green-600">₱{formatPrice(p.revenue)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                    <button
                      onClick={() => router.push("/seller/orders")}
                      className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                      aria-label="Refresh"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4">No recent activity.</p>
                  ) : (
                    <ul className="space-y-4">
                      {recentActivity.map((a) => (
                        <li key={a.id} className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                            <ShoppingBasket size={18} className="text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{a.title}</p>
                            <p className="text-sm text-gray-500">{a.detail} · {formatRelativeTime(a.time)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
