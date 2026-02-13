"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBars, 
  faTimes, 
  faChartLine, 
  faUsers, 
  faStore, 
  faGripHorizontal, 
  faChevronRight, 
  faEllipsisV,
  faSignOutAlt
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/app/context/AuthContext";

export default function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, username } = useAuth();
  const [open, setOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const dashboard = () => router.push("/admin/dashboard");
  const viewUsers = () => router.push("/admin/viewUsers");
  const viewSellers = () => router.push("/admin/viewSellers");

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
    router.push("/");
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
      path: "/admin/dashboard",
      action: dashboard,
    },
    {
      id: "users",
      label: "View Users",
      icon: faUsers,
      path: "/admin/viewUsers",
      action: viewUsers,
    },
    {
      id: "sellers",
      label: "View Sellers",
      icon: faStore,
      path: "/admin/viewSellers",
      action: viewSellers,
    },
  ];

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040] shadow-sm z-30">
        <div className="flex justify-between items-center px-4 py-3">
          <div onClick={dashboard} className="flex items-center gap-2 cursor-pointer group">
          <div className="w-10 h-10 bg-[#FFBF00] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <FontAwesomeIcon icon={faChartLine} className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#2C2C2C] dark:text-[#e5e5e5]">TotallyNormal</h1>
              <p className="text-xs text-[#666666] dark:text-[#a3a3a3] -mt-1">Admin Portal</p>
            </div>
          </div>
          <button onClick={() => setOpen(!open)} className="p-2.5 rounded-xl transition-all active:scale-95">
            <FontAwesomeIcon icon={open ? faTimes : faBars} className="text-[#2C2C2C] dark:text-[#e5e5e5] text-xl" />
          </button>
        </div>
      </div>

      <aside
        className={`fixed md:sticky top-0 left-0 md:left-auto h-screen bg-white dark:bg-[#2C2C2C] border-r border-[#E0E0E0] dark:border-[#404040] transform transition-all duration-300 ease-in-out z-50 shadow-xl md:shadow-none
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 w-72 md:w-72`}
      >
        <div className="flex flex-col h-full">
          <div onClick={dashboard} className="hidden md:flex items-center gap-3 p-6 border-b border-[#E0E0E0] dark:border-[#404040] cursor-pointer group">
            <div className="w-12 h-12 bg-[#FFBF00] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <FontAwesomeIcon icon={faChartLine} className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5]">TotallyNormal</h1>
              <p className="text-sm text-[#666666] dark:text-[#a3a3a3] -mt-0.5">Admin Portal</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <div className="flex items-center gap-2 px-3 mb-3">
                <FontAwesomeIcon icon={faGripHorizontal} className="text-[#666666] dark:text-[#a3a3a3] text-sm" />
                <p className="text-xs font-bold text-[#666666] dark:text-[#a3a3a3] uppercase tracking-wider">Navigation</p>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { item.action(); setOpen(false); }}
                      className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${
                        isActive ? "bg-[#FFBF00] text-white shadow-md" : "text-[#666666] dark:text-[#a3a3a3] hover:text-[#2C2C2C] dark:hover:text-[#e5e5e5]"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isActive ? "bg-white/20" : "bg-[#E0E0E0] dark:bg-[#404040]/50"}`}>
                        <FontAwesomeIcon icon={item.icon} className={`text-lg ${isActive ? "text-white" : "text-[#666666] dark:text-[#a3a3a3] group-hover:text-[#FFBF00]"}`} />
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

          <div className="p-4 border-t border-[#E0E0E0] dark:border-[#404040]">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`w-full flex items-center gap-3 px-2 py-3 rounded-lg transition-colors group ${showDropdown ? "bg-[#E0E0E0] dark:bg-[#404040]" : ""}`}
              >
                <div className="w-11 h-11 bg-[#FFBF00] rounded-xl flex items-center justify-center shadow-md">
                  <FontAwesomeIcon icon={faChartLine} className="text-white text-lg" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-sm truncate text-[#2C2C2C] dark:text-[#e5e5e5]">{username ? `${username.toUpperCase()}'S ACCOUNT` : "Admin Account"}</p>
                  <p className="text-xs text-[#666666] dark:text-[#a3a3a3] truncate">Full Access</p>
                </div>
                <FontAwesomeIcon icon={faBars} className="cursor-pointer text-sm text-[#666666] dark:text-[#a3a3a3]" />
              </button>

                {showDropdown && (
                <div className="absolute bottom-0 left-full ml-2 bg-white dark:bg-[#2C2C2C] rounded-xl shadow-xl border border-[#E0E0E0] dark:border-[#404040] py-2 z-50 animate-in fade-in slide-in-from-left-2 duration-200 w-64">
                  <button onClick={() => handleMenuClick(() => router.push("/admin/dashboard"))} className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#2C2C2C] dark:text-[#e5e5e5] hover:text-[#FFBF00] transition-colors group">
                    <FontAwesomeIcon icon={faChartLine} className="text-base text-[#666666] dark:text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                    <span className="font-medium text-sm">Dashboard</span>
                  </button>
                  <button onClick={() => handleMenuClick(() => router.push("/admin/viewUsers"))} className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#2C2C2C] dark:text-[#e5e5e5] hover:text-[#FFBF00] transition-colors group">
                    <FontAwesomeIcon icon={faUsers} className="text-base text-[#666666] dark:text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                    <span className="font-medium text-sm">View Users</span>
                  </button>
                  <button onClick={() => handleMenuClick(() => router.push("/admin/viewSellers"))} className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#2C2C2C] dark:text-[#e5e5e5] hover:text-[#FFBF00] transition-colors group">
                    <FontAwesomeIcon icon={faStore} className="text-base text-[#666666] dark:text-[#a3a3a3] group-hover:text-[#FFBF00]" />
                    <span className="font-medium text-sm">View Sellers</span>
                  </button>
                  <div className="border-t border-[#E0E0E0] dark:border-[#404040] my-1"></div>
                  <button onClick={handleLogout} className="cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#2C2C2C] dark:text-[#e5e5e5] hover:text-[#F44336] transition-colors group">
                    <FontAwesomeIcon icon={faSignOutAlt} className="text-base text-[#666666] dark:text-[#a3a3a3] group-hover:text-[#F44336]" />
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
