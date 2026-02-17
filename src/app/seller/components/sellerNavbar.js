"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authFunctions, chatFunctions, sellerOrderFunctions } from "@/lib/supabase/api";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import {
  Menu,
  Close,
  ChartLine,
  PlusCircle,
  Folders,
  ShoppingBasket,
  Store,
  Grid,
  ChevronRight,
  LogOut,
  UserCircle,
  Package,
  Settings,
  Users,
  Chat,
  ConciergeBell as Bell,
  Switch,
  AnnotationQuestion,
} from "griddy-icons";
import { useAuth } from "@/app/context/AuthContext";
import { useChatModal } from "@/app/context/ChatModalContext";
import { useSellerOrderRealtime } from "@/app/hooks/useSellerOrderRealtime";

const STORE_NAME = "Totally Normal Store";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, username, role } = useAuth();
  const { openChat } = useChatModal();
  const [open, setOpen] = useState(false);

  const addProduct = () => router.push("/seller/addProduct");
  const viewProduct = () => router.push("/seller/viewProduct");
  const dashboard = () => router.push("/seller/dashboard");
  const orders = () => router.push("/seller/orders");
  const customers = () => router.push("/seller/customers");
  const settings = () => router.push("/seller/settings");
  const messages = () => openChat();
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [orderNotificationCount, setOrderNotificationCount] = useState(0);
  const [orderNotificationList, setOrderNotificationList] = useState([]);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [loadingOrderNotifications, setLoadingOrderNotifications] = useState(false);
  const orderDropdownRefMobile = useRef(null);
  const orderDropdownRefDesktop = useRef(null);

  useEffect(() => {
    if (!username) {
      setUnreadTotal(0);
      return;
    }
    let cancelled = false;
    chatFunctions.getConversations().then((data) => {
      if (!cancelled) setUnreadTotal(data?.unreadTotal ?? 0);
    }).catch(() => { if (!cancelled) setUnreadTotal(0); });
    return () => { cancelled = true; };
  }, [username]);

  const fetchOrderNotifications = () => {
    if (!username) return;
    setLoadingOrderNotifications(true);
    sellerOrderFunctions.getSellerOrderNotifications()
      .then((data) => {
        setOrderNotificationCount(data?.count ?? 0);
        setOrderNotificationList(data?.orders ?? []);
      })
      .catch(() => {
        setOrderNotificationCount(0);
        setOrderNotificationList([]);
      })
      .finally(() => setLoadingOrderNotifications(false));
  };

  useEffect(() => {
    if (!username) {
      setOrderNotificationCount(0);
      setOrderNotificationList([]);
      return;
    }
    fetchOrderNotifications();
    const interval = setInterval(fetchOrderNotifications, 60000);
    return () => clearInterval(interval);
  }, [username]);

  useEffect(() => {
    if (showOrderDropdown) fetchOrderNotifications();
  }, [showOrderDropdown]);

  useSellerOrderRealtime(
    username,
    (newOrder) => {
      setOrderNotificationCount((prev) => prev + 1);
      setOrderNotificationList((prev) => [
        {
          id: newOrder.id,
          product_name: newOrder.product_name,
          quantity: newOrder.quantity,
          total_amount: newOrder.total_amount,
          created_at: newOrder.created_at,
          order_group_id: newOrder.order_group_id,
        },
        ...prev,
      ].slice(0, 20));
    },
    !!username
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inMobile = orderDropdownRefMobile.current?.contains(e.target);
      const inDesktop = orderDropdownRefDesktop.current?.contains(e.target);
      if (!inMobile && !inDesktop) setShowOrderDropdown(false);
    };
    if (showOrderDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOrderDropdown]);

  const handleLogout = async () => {
    await authFunctions.logout();
    logout();
    router.replace("/");
  };

  const userPortalItems = [
    { id: "profile", label: "My Profile", icon: UserCircle, path: "/account", action: () => router.push("/account") },
  ];
  const sellerPortalItems = [
    { id: "dashboard", label: "Dashboard", icon: Grid, path: "/seller/dashboard", action: dashboard },
    { id: "inventory", label: "Inventory", icon: Folders, path: "/seller/viewProduct", action: viewProduct },
    { id: "orders", label: "Orders", icon: Package, path: "/seller/orders", action: orders },
    { id: "customers", label: "Customers", icon: Users, path: "/seller/customers", action: customers },
    { id: "messages", label: "Messages", icon: Chat, path: null, action: messages, badge: unreadTotal },
    { id: "settings", label: "Settings", icon: Settings, path: "/seller/settings", action: settings },
  ];
  const adminPortalItems = role === "admin" ? [{ id: "admin", label: "Admin", icon: ChartLine, path: "/admin/dashboard", action: () => router.push("/admin/dashboard") }] : [];

  const renderNavItem = (item, isActive) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => { item.action(); setOpen(false); }}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-r-xl transition-all group ${
          isActive ? "bg-[#FFFBF0] text-gray-900" : "text-gray-600 hover:bg-gray-100"
        }`}
      >
        {Icon ? <Icon size={20} className={isActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-700"} /> : null}
        <span className="flex-1 text-left font-medium">{item.label}</span>
        {item.badge > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile header - light theme */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-30">
        <div className="flex justify-between items-center px-4 py-3">
          <div onClick={dashboard} className="flex items-center gap-2 cursor-pointer group">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Store size={20} className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{STORE_NAME}</h1>
              <p className="text-xs text-gray-500 -mt-1">Seller Portal</p>
            </div>
          </div>
          <div className="relative flex items-center gap-1" ref={orderDropdownRefMobile}>
            <button
              type="button"
              onClick={() => setShowOrderDropdown(!showOrderDropdown)}
              className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
              aria-label="Order notifications"
            >
              <Bell size={22} className="text-gray-700" />
              {orderNotificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                  {orderNotificationCount > 99 ? "99+" : orderNotificationCount}
                </span>
              )}
            </button>
            {showOrderDropdown && (
              <div className="absolute top-full right-0 mt-1 w-80 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2">
                <div className="px-3 pb-2 border-b border-gray-200 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">New orders</span>
                  <button type="button" onClick={() => { setShowOrderDropdown(false); orders(); }} className="text-sm text-orange-600 hover:underline">View all</button>
                </div>
                {loadingOrderNotifications ? (
                  <div className="p-4 flex justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : orderNotificationList.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">No new orders</p>
                ) : (
                  <ul className="py-1">
                    {orderNotificationList.map((o) => (
                      <li key={o.id} className="px-3 py-2 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900 truncate">{o.product_name}</p>
                        <p className="text-xs text-gray-500">₱{Number(o.total_amount).toLocaleString()} · {o.created_at ? formatRelativeTime(o.created_at) : ""}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <button onClick={() => setOpen(!open)} className="p-2.5 hover:bg-gray-100 rounded-xl transition-all active:scale-95">
            {open ? <Close size={22} className="text-gray-700 text-xl" /> : <Menu size={22} className="text-gray-700 text-xl" />}
          </button>
        </div>
      </div>

      {/* Sidebar - light theme */}
      <aside
        className={`fixed md:sticky top-0 left-0 md:left-auto h-screen w-72 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out z-50 shadow-lg md:shadow-none flex flex-col
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div onClick={dashboard} className="flex items-center gap-3 p-6 border-b border-gray-200 cursor-pointer group shrink-0">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Store size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{STORE_NAME}</h1>
            <p className="text-sm text-gray-500 -mt-0.5">Seller Portal</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="mb-4 relative" ref={orderDropdownRefDesktop}>
            <button
              type="button"
              onClick={() => setShowOrderDropdown(!showOrderDropdown)}
              className="w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-r-xl hover:bg-gray-100 transition-all group"
              aria-label="Order notifications"
            >
              <Bell size={20} className="text-gray-500 group-hover:text-orange-600" />
              <span className="flex-1 text-left font-medium text-gray-700">Notifications</span>
              {orderNotificationCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-xs font-bold inline-flex items-center justify-center">
                  {orderNotificationCount > 99 ? "99+" : orderNotificationCount}
                </span>
              )}
            </button>
            {showOrderDropdown && (
              <div className="absolute left-2 right-2 top-full mt-1 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2">
                <div className="px-3 pb-2 border-b border-gray-200 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">New orders</span>
                  <button type="button" onClick={() => { setShowOrderDropdown(false); orders(); }} className="text-sm text-orange-600 hover:underline">View all</button>
                </div>
                {loadingOrderNotifications ? (
                  <div className="p-4 flex justify-center"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : orderNotificationList.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">No new orders</p>
                ) : (
                  <ul className="py-1">
                    {orderNotificationList.map((o) => (
                      <li key={o.id} className="px-3 py-2 hover:bg-gray-50">
                        <p className="text-sm font-medium text-gray-900 truncate">{o.product_name}</p>
                        <p className="text-xs text-gray-500">₱{Number(o.total_amount).toLocaleString()} · {o.created_at ? formatRelativeTime(o.created_at) : ""}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {userPortalItems.length > 0 && (
            <div className="mb-4">
              <p className="px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">User Portal</p>
              {userPortalItems.map((item) => renderNavItem(item, pathname === item.path))}
            </div>
          )}
          <div className="mb-4">
            <p className="px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Seller Portal</p>
            {sellerPortalItems.map((item) => renderNavItem(item, pathname === item.path))}
          </div>
          {adminPortalItems.length > 0 && (
            <div className="mb-4">
              <p className="px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Admin Portal</p>
              {adminPortalItems.map((item) => renderNavItem(item, pathname === item.path))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-2 shrink-0">
          <button
            onClick={() => { router.push("/dashboard"); setOpen(false); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
          >
            <Switch size={20} />
            Switch Portal
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/help")} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 text-sm">
              <AnnotationQuestion size={18} />
              Help Center
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 text-sm">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200" />
      )}
    </>
  );
}