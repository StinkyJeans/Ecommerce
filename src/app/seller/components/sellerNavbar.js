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
} from "griddy-icons";
import { useAuth } from "@/app/context/AuthContext";
import { useChatModal } from "@/app/context/ChatModalContext";
import { useSellerOrderRealtime } from "@/app/hooks/useSellerOrderRealtime";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, username } = useAuth();
  const { openChat } = useChatModal();
  const [open, setOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
    setShowDropdown(false);
    await authFunctions.logout();
    logout();
    router.replace("/");
  };

  const handleMenuClick = (action) => {
    setShowDropdown(false);
    if (action) {
      action();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: ChartLine,
      path: "/seller/dashboard",
      action: dashboard,
    },
    {
      id: "orders",
      label: "Orders",
      icon: ShoppingBasket,
      path: "/seller/orders",
      action: orders,
    },
    {
      id: "add",
      label: "Add Product",
      icon: PlusCircle,
      path: "/seller/addProduct",
      action: addProduct,
    },
    {
      id: "products",
      label: "My Products",
      icon: Folders,
      path: "/seller/viewProduct",
      action: viewProduct,
    },
    {
      id: "customers",
      label: "Customers",
      icon: Users,
      path: "/seller/customers",
      action: customers,
    },
    {
      id: "messages",
      label: "Messages",
      icon: Chat,
      path: null,
      action: messages,
      badge: unreadTotal,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/seller/settings",
      action: settings,
    },
  ];

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#2C2C2C] border-b border-[#404040] shadow-sm z-30">
        <div className="flex justify-between items-center px-4 py-3">
          <div
            onClick={dashboard}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-[#FFBF00] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Store size={20} className="text-[#2C2C2C] text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#e5e5e5]">TotallyNormal</h1>
              <p className="text-xs text-[#a3a3a3] -mt-1">Seller Portal</p>
            </div>
          </div>
          <div className="relative flex items-center gap-1" ref={orderDropdownRefMobile}>
            <button
              type="button"
              onClick={() => setShowOrderDropdown(!showOrderDropdown)}
              className="relative p-2.5 hover:bg-[#404040] rounded-xl transition-all active:scale-95"
              aria-label="Order notifications"
            >
              <Bell size={22} className="text-[#e5e5e5]" />
              {orderNotificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                  {orderNotificationCount > 99 ? "99+" : orderNotificationCount}
                </span>
              )}
            </button>
            {showOrderDropdown && (
              <div className="absolute top-full right-0 mt-1 w-80 max-h-72 overflow-y-auto bg-[#2C2C2C] border border-[#404040] rounded-xl shadow-xl z-50 py-2">
                <div className="px-3 pb-2 border-b border-[#404040] flex items-center justify-between">
                  <span className="font-semibold text-[#e5e5e5]">New orders</span>
                  <button type="button" onClick={() => { setShowOrderDropdown(false); orders(); }} className="text-sm text-[#FFBF00] hover:underline">View all</button>
                </div>
                {loadingOrderNotifications ? (
                  <div className="p-4 flex justify-center"><div className="w-6 h-6 border-2 border-[#FFBF00] border-t-transparent rounded-full animate-spin" /></div>
                ) : orderNotificationList.length === 0 ? (
                  <p className="p-4 text-sm text-[#a3a3a3]">No new orders</p>
                ) : (
                  <ul className="py-1">
                    {orderNotificationList.map((o) => (
                      <li key={o.id} className="px-3 py-2 hover:bg-[#404040]">
                        <p className="text-sm font-medium text-[#e5e5e5] truncate">{o.product_name}</p>
                        <p className="text-xs text-[#a3a3a3]">₱{Number(o.total_amount).toLocaleString()} · {o.created_at ? formatRelativeTime(o.created_at) : ""}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="p-2.5 hover:bg-[#404040] rounded-xl transition-all active:scale-95"
          >
            {open ? <Close size={22} className="text-[#e5e5e5] text-xl" /> : <Menu size={22} className="text-[#e5e5e5] text-xl" />}
          </button>
        </div>
      </div>

      <aside
        className={`fixed md:sticky top-0 left-0 md:left-auto h-screen bg-[#2C2C2C] border-r border-[#404040] transform transition-all duration-300 ease-in-out z-50 shadow-xl md:shadow-none
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 w-72 md:w-72`}
      >
        <div className="flex flex-col h-full">
          <div
            onClick={dashboard}
            className="hidden md:flex items-center gap-3 p-6 border-b border-[#404040] cursor-pointer group"
          >
            <div className="w-12 h-12 bg-[#FFBF00] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Store size={24} className="text-[#2C2C2C] text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#e5e5e5]">TotallyNormal</h1>
              <p className="text-sm text-[#a3a3a3] -mt-0.5">Seller Portal</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 relative" ref={orderDropdownRefDesktop}>
              <button
                type="button"
                onClick={() => setShowOrderDropdown(!showOrderDropdown)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#404040] transition-all group"
                aria-label="Order notifications"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#404040]/50 group-hover:bg-[#505050]">
                  <Bell size={20} className="text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold text-[#e5e5e5]">Notifications</span>
                  {orderNotificationCount > 0 && (
                    <span className="ml-2 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold inline-flex items-center justify-center">
                      {orderNotificationCount > 99 ? "99+" : orderNotificationCount}
                    </span>
                  )}
                </div>
              </button>
              {showOrderDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 max-h-72 overflow-y-auto bg-[#1a1a1a] border border-[#404040] rounded-xl shadow-xl z-50 py-2">
                  <div className="px-3 pb-2 border-b border-[#404040] flex items-center justify-between">
                    <span className="font-semibold text-[#e5e5e5]">New orders</span>
                    <button type="button" onClick={() => { setShowOrderDropdown(false); orders(); }} className="text-sm text-[#FFBF00] hover:underline">View all</button>
                  </div>
                  {loadingOrderNotifications ? (
                    <div className="p-4 flex justify-center"><div className="w-6 h-6 border-2 border-[#FFBF00] border-t-transparent rounded-full animate-spin" /></div>
                  ) : orderNotificationList.length === 0 ? (
                    <p className="p-4 text-sm text-[#a3a3a3]">No new orders</p>
                  ) : (
                    <ul className="py-1">
                      {orderNotificationList.map((o) => (
                        <li key={o.id} className="px-3 py-2 hover:bg-[#404040]">
                          <p className="text-sm font-medium text-[#e5e5e5] truncate">{o.product_name}</p>
                          <p className="text-xs text-[#a3a3a3]">₱{Number(o.total_amount).toLocaleString()} · {o.created_at ? formatRelativeTime(o.created_at) : ""}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-2 px-3 mb-3">
                <Grid size={16} className="text-[#a3a3a3] text-sm" />
                <p className="text-xs font-bold text-[#a3a3a3] uppercase tracking-wider">Navigation</p>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { item.action(); setOpen(false); }}
                      className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${
                        isActive ? "bg-[#FFBF00] text-[#2C2C2C] shadow-md" : "text-[#a3a3a3] hover:bg-[#404040] hover:text-[#e5e5e5]"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isActive ? "bg-[#2C2C2C]/20" : "bg-[#404040]/50 group-hover:bg-[#505050]"}`}>
                        {(() => { const Icon = item.icon; return Icon ? <Icon size={20} className={`text-lg ${isActive ? "text-[#2C2C2C]" : "text-[#a3a3a3] group-hover:text-[#FFBF00]"}`} /> : null; })()}
                      </div>
                      <div className="flex-1 text-left flex items-center gap-2">
                        <span className="font-semibold">{item.label}</span>
                        {item.badge > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                            {item.badge > 99 ? "99+" : item.badge}
                          </span>
                        )}
                      </div>
                      {isActive && <ChevronRight size={16} className="text-sm" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="p-4 border-t border-[#404040]">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`w-full flex items-center gap-3 px-2 py-3 rounded-lg transition-colors group ${showDropdown ? "bg-[#404040]" : "hover:bg-[#404040]"}`}
              >
                <div className="w-11 h-11 bg-[#FFBF00] rounded-xl flex items-center justify-center shadow-md">
                  <Store size={20} className="text-[#2C2C2C] text-lg" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-sm truncate text-[#e5e5e5]">{username ? `${username.toUpperCase()}'S ACCOUNT` : "Seller Account"}</p>
                  <p className="text-xs text-[#a3a3a3] truncate">Active Status</p>
                </div>
                <Menu size={16} className="text-sm text-[#a3a3a3]" />
              </button>

              {showDropdown && (
                <div className="absolute bottom-0 left-full ml-2 bg-[#2C2C2C] rounded-xl shadow-xl border border-[#404040] py-2 z-50 animate-in fade-in slide-in-from-left-2 duration-200 w-64">
                  <button onClick={() => handleMenuClick(() => router.push("/account?tab=addresses"))} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#e5e5e5] hover:bg-[#404040] hover:text-[#FFBF00] transition-colors group">
                    <UserCircle size={18} className="text-base text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                    <span className="font-medium text-sm">Manage My Account</span>
                  </button>
                  <button onClick={() => handleMenuClick(() => router.push("/seller/sellerCart"))} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#e5e5e5] hover:bg-[#404040] hover:text-[#FFBF00] transition-colors group">
                    <Package size={18} className="text-base text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                    <span className="font-medium text-sm">My Orders</span>
                  </button>
                  <button onClick={() => handleMenuClick(() => router.push("/seller/viewProduct"))} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#e5e5e5] hover:bg-[#404040] hover:text-[#FFBF00] transition-colors group">
                    <Folders size={18} className="text-base text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                    <span className="font-medium text-sm">My Products</span>
                  </button>
                  <div className="border-t border-[#404040] my-1"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#e5e5e5] hover:bg-[#404040] hover:text-[#F44336] transition-colors group">
                    <LogOut size={18} className="text-base text-[#a3a3a3] group-hover:text-[#F44336]" />
                    <span className="font-medium text-sm">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        ></div>
      )}
    </>
  );
}