"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // const addProduct = () => router.push("/seller/addProduct");
  // const viewProduct = () => router.push("/seller/viewProduct");
  // const dashboard = () => router.push("/seller/dashboard");

  return (
    <>
      {/* Top Bar (Mobile) */}
      <div className="md:hidden fixed top-0 left-0 right-0 flex justify-between bg-gray-800 text-white p-4 items-center z-30">
        <h1
          className="text-lg font-bold cursor-pointer"
          // onClick={dashboard}
        >
          Stupid Shit
        </h1>
        <button onClick={() => setOpen(!open)} className="p-2">
          <FontAwesomeIcon icon={open ? faTimes : faBars} size="lg" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 right-0 md:left-0 h-screen bg-gray-800 text-white p-6 transform transition-transform duration-300 ease-in-out z-50
        ${
          open ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0 w-64 md:w-64`}
      >
        <div className="flex flex-col h-full">
          <h1
            // onClick={dashboard}
            className="hidden md:block text-xl font-bold mb-6 cursor-pointer"
          >
            Stupid Shit
          </h1>

          <p className="text-gray-300 text-sm">Category</p>
          <p className="mb-4 text-gray-600">_______________________</p>

          <ul className="space-y-2 flex-1">
            <li>
              <span
                // onClick={() => {
                //   dashboard();
                //   setOpen(false);
                // }}
                className={`block px-3 py-2 rounded cursor-pointer transition ${
                  pathname === "/seller/dashboard"
                    ? "bg-red-600 text-white"
                    : "hover:text-red-400"
                }`}
              >
                PC
              </span>
            </li>
            <li>
              <span
                // onClick={() => {
                //   addProduct();
                //   setOpen(false);
                // }}
                className={`block px-3 py-2 rounded cursor-pointer transition ${
                  pathname === "/seller/addProduct"
                    ? "bg-red-600 text-white"
                    : "hover:text-red-400"
                }`}
              >
                Mobile
              </span>
            </li>
            <li>
              <span
                // onClick={() => {
                //   viewProduct();
                //   setOpen(false);
                // }}
                className={`block px-3 py-2 rounded cursor-pointer transition ${
                  pathname === "/seller/viewProduct"
                    ? "bg-red-600 text-white"
                    : "hover:text-red-400"
                }`}
              >
                Watch
              </span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Overlay (Mobile only) */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 backdrop-blur-sm bg-black/30 z-40 md:hidden"
        ></div>
      )}
    </>
  );
}
