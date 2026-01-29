"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBars, 
  faTimes, 
  faDesktop, 
  faMobileAlt, 
  faClock, 
  faStore, 
  faStar, 
  faGripHorizontal, 
  faChevronRight, 
  faUser, 
  faEllipsisV,
  faChartLine
} from "@fortawesome/free-solid-svg-icons";
import ThemeToggle from "./ThemeToggle";
export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const categoryPC = () => router.push("/product/category/computers");
  const categoryMobile = () => router.push("/product/category/mobilephones");
  const categoryWatch = () => router.push("/product/category/watches");
  const dashboard = () => router.push("/dashboard");
  const FeaturedProducts = () => router.push("/dashboard");
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: faChartLine,
      path: "/dashboard",
      action: dashboard,
    },
    {
      id: "categoryPC",
      label: "Computers",
      icon: faDesktop,
      path: "/product/category/computers",
      action: categoryPC,
    },
    {
      id: "categoryMobile",
      label: "Mobile Phones",
      icon: faMobileAlt,
      path: "/product/category/mobilephones",
      action: categoryMobile,
    },
    {
      id: "categoryWatch",
      label: "Watches",
      icon: faClock,
      path: "/product/category/watches",
      action: categoryWatch,
    },
  ];
  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-[#2C2C2C] border-b border-[#E0E0E0] dark:border-[#404040] shadow-sm z-30">
        <div className="flex justify-between items-center px-4 py-3">
          <div onClick={dashboard} className="flex items-center gap-2 cursor-pointer group">
            <div className="w-10 h-10 bg-[#FFBF00] rounded-xl flex items-center justify-center shadow group-hover:scale-105 transition-transform">
              <FontAwesomeIcon icon={faStore} className="text-[#2C2C2C] text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#2C2C2C] dark:text-white">TotallyNormal</h1>
              <p className="text-xs text-[#666666] dark:text-[#a3a3a3] -mt-1">User Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setOpen(!open)} className="p-2.5 hover:bg-gray-50 dark:hover:bg-[#404040] rounded-xl transition-all active:scale-95">
              <FontAwesomeIcon icon={open ? faTimes : faBars} className="text-[#2C2C2C] dark:text-[#e5e5e5] text-xl" />
            </button>
          </div>
        </div>
      </div>
      <aside
        className={`fixed md:sticky top-0 left-0 md:left-auto h-screen bg-[#2C2C2C] border-r border-[#404040] transform transition-all duration-300 ease-in-out z-50 shadow-xl md:shadow-none
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 w-72 md:w-72`}
      >
        <div className="flex flex-col h-full">
          <div onClick={dashboard} className="hidden md:flex items-center gap-3 p-6 border-b border-[#404040] cursor-pointer group">
            <div className="w-12 h-12 bg-[#FFBF00] rounded-xl flex items-center justify-center shadow group-hover:scale-105 transition-transform">
              <FontAwesomeIcon icon={faStore} className="text-[#2C2C2C] text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TotallyNormal</h1>
              <p className="text-sm text-[#a3a3a3] -mt-0.5">User Portal</p>
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
                      onClick={() => {
                        item.action();
                        setOpen(false);
                      }}
                      className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group ${
                        isActive
                          ? "bg-[#FFBF00] text-[#2C2C2C] shadow"
                          : "text-[#e5e5e5] hover:bg-[#404040] hover:text-white"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-[#2C2C2C]/20"
                            : "bg-[#404040] group-hover:bg-[#505050]"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={item.icon}
                          className={`text-lg ${
                            isActive
                              ? "text-white"
                              : "text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      {isActive && (
                        <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
          <div className="p-4 border-t border-[#404040]">
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="w-11 h-11 bg-[#FFBF00] rounded-xl flex items-center justify-center shadow">
                <FontAwesomeIcon icon={faUser} className="text-[#2C2C2C] text-lg" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">User Account</p>
                <p className="text-xs text-[#a3a3a3]">Active Status</p>
              </div>
              <button className="p-2 hover:bg-[#404040] rounded-lg transition-colors">
                <FontAwesomeIcon icon={faEllipsisV} className="text-[#a3a3a3]" />
              </button>
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