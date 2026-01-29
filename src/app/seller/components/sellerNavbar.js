"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authFunctions } from "@/lib/supabase/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBars, 
  faTimes, 
  faChartLine, 
  faPlusCircle, 
  faBoxes, 
  faShoppingBag, 
  faStore, 
  faGripHorizontal, 
  faChevronRight, 
  faEllipsisV,
  faSignOutAlt,
  faUserCircle,
  faBox,
  faCog,
  faUsers
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/app/context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, username } = useAuth();
  const [open, setOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const addProduct = () => router.push("/seller/addProduct");
  const viewProduct = () => router.push("/seller/viewProduct");
  const dashboard = () => router.push("/seller/dashboard");
  const orders = () => router.push("/seller/orders");
  const customers = () => router.push("/seller/customers");
  const settings = () => router.push("/seller/settings");

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
      icon: faChartLine,
      path: "/seller/dashboard",
      action: dashboard,
    },
    {
      id: "orders",
      label: "Orders",
      icon: faShoppingBag,
      path: "/seller/orders",
      action: orders,
    },
    {
      id: "add",
      label: "Add Product",
      icon: faPlusCircle,
      path: "/seller/addProduct",
      action: addProduct,
    },
    {
      id: "products",
      label: "My Products",
      icon: faBoxes,
      path: "/seller/viewProduct",
      action: viewProduct,
    },
    {
      id: "customers",
      label: "Customers",
      icon: faUsers,
      path: "/seller/customers",
      action: customers,
    },
    {
      id: "settings",
      label: "Settings",
      icon: faCog,
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
              <FontAwesomeIcon icon={faStore} className="text-[#2C2C2C] text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#e5e5e5]">TotallyNormal</h1>
              <p className="text-xs text-[#a3a3a3] -mt-1">Seller Portal</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="p-2.5 hover:bg-[#404040] rounded-xl transition-all active:scale-95"
          >
            <FontAwesomeIcon icon={open ? faTimes : faBars} className="text-[#e5e5e5] text-xl" />
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
              <FontAwesomeIcon icon={faStore} className="text-[#2C2C2C] text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#e5e5e5]">TotallyNormal</h1>
              <p className="text-sm text-[#a3a3a3] -mt-0.5">Seller Portal</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <div className="flex items-center gap-2 px-3 mb-3">
                <FontAwesomeIcon icon={faGripHorizontal} className="text-[#a3a3a3] text-sm" />
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
                        <FontAwesomeIcon icon={item.icon} className={`text-lg ${isActive ? "text-[#2C2C2C]" : "text-[#a3a3a3] group-hover:text-[#FFBF00]"}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      {isActive && <FontAwesomeIcon icon={faChevronRight} className="text-sm" />}
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
                  <FontAwesomeIcon icon={faStore} className="text-[#2C2C2C] text-lg" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-sm truncate text-[#e5e5e5]">{username ? `${username.toUpperCase()}'S ACCOUNT` : "Seller Account"}</p>
                  <p className="text-xs text-[#a3a3a3] truncate">Active Status</p>
                </div>
                <FontAwesomeIcon icon={faBars} className="text-sm text-[#a3a3a3]" />
              </button>

              {showDropdown && (
                <div className="absolute bottom-0 left-full ml-2 bg-[#2C2C2C] rounded-xl shadow-xl border border-[#404040] py-2 z-50 animate-in fade-in slide-in-from-left-2 duration-200 w-64">
                  <button onClick={() => handleMenuClick(() => router.push("/account?tab=addresses"))} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#e5e5e5] hover:bg-[#404040] hover:text-[#FFBF00] transition-colors group">
                    <FontAwesomeIcon icon={faUserCircle} className="text-base text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                    <span className="font-medium text-sm">Manage My Account</span>
                  </button>
                  <button onClick={() => handleMenuClick(() => router.push("/seller/sellerCart"))} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#e5e5e5] hover:bg-[#404040] hover:text-[#FFBF00] transition-colors group">
                    <FontAwesomeIcon icon={faBox} className="text-base text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                    <span className="font-medium text-sm">My Orders</span>
                  </button>
                  <button onClick={() => handleMenuClick(() => router.push("/seller/viewProduct"))} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#e5e5e5] hover:bg-[#404040] hover:text-[#FFBF00] transition-colors group">
                    <FontAwesomeIcon icon={faBoxes} className="text-base text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                    <span className="font-medium text-sm">My Products</span>
                  </button>
                  <div className="border-t border-[#404040] my-1"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#e5e5e5] hover:bg-[#404040] hover:text-[#F44336] transition-colors group">
                    <FontAwesomeIcon icon={faSignOutAlt} className="text-base text-[#a3a3a3] group-hover:text-[#F44336]" />
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