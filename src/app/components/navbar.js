"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

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
      id: "categoryPC",
      label: "Computers",
      icon: "fa-chart-line",
      path: "/product/category/computers",
      action: categoryPC,
    },
    {
      id: "categoryMobile",
      label: "Mobile Phones",
      icon: "fa-plus-circle",
      path: "/product/category/mobilephones",
      action: categoryMobile,
    },
    {
      id: "categoryWatch",
      label: "Watches",
      icon: "fa-box-open",
      path: "/product/category/watches",
      action: categoryWatch,
    },
  ];

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm z-30">
        <div className="flex justify-between items-center px-4 py-3">
          <div
            onClick={dashboard}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <i className="fas fa-store text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                TotallyNormalStore
              </h1>
              <p className="text-xs text-gray-500 -mt-1">User Portal</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
          >
            <FontAwesomeIcon
              icon={open ? faTimes : faBars}
              className="text-gray-700 text-xl"
            />
          </button>
        </div>
      </div>

      <aside
        className={`fixed md:sticky top-0 right-0 md:right-auto h-screen bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out z-50 shadow-xl md:shadow-none
        ${open ? "translate-x-0" : "translate-x-full"} md:translate-x-0 w-72 md:w-72`}
      >
        <div className="flex flex-col h-full">
          <div
            onClick={dashboard}
            className="hidden md:flex items-center gap-3 p-6 border-b border-gray-200 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <i className="fas fa-store text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                TotallyNormal
              </h1>
              <p className="text-sm text-gray-500 -mt-0.5">User Portal</p>
            </div>
          </div>
                    <div
            onClick={FeaturedProducts}
            className="hidden md:flex items-center gap-3 p-6 border-b border-gray-200 cursor-pointer group"
          >
            <div>
              <p className="text-sm text-gray-500 -mt-0.5">Featured Products</p>          
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">

              <div className="flex items-center gap-2 px-3 mb-3">
                <i className="fas fa-grip-horizontal text-gray-400 text-sm"></i>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Navigation
                </p>
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
                          ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30"
                          : "text-gray-700 hover:bg-gray-100 hover:text-red-600"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                          isActive
                            ? "bg-white/20"
                            : "bg-gray-100 group-hover:bg-red-50"
                        }`}
                      >
                        <i
                          className={`fas ${item.icon} text-lg ${
                            isActive
                              ? "text-white"
                              : "text-gray-600 group-hover:text-red-600"
                          }`}
                        ></i>
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-semibold">{item.label}</span>
                      </div>
                      {isActive && (
                        <i className="fas fa-chevron-right text-sm"></i>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                S
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">Seller Account</p>
                <p className="text-xs text-gray-500">Active Status</p>
              </div>
              <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                <i className="fas fa-ellipsis-v text-gray-600"></i>
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