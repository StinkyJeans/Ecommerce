"use client";

import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname(); // 🧭 get current path

  const addProduct = () => router.push("/seller/addProduct");
  const viewProduct = () => router.push("/seller/viewProduct");
  const dashboard = () => router.push("/seller/dashboard");

  return (
    <aside className="h-screen w-64 bg-gray-800 text-white p-6 flex flex-col justify-between">
      <div>
        <h1 className="text-xl font-bold mb-6">Stupid Shit</h1>

        <p className="text-gray-300">Category</p>
        <p className="mb-2">_______________________</p>
        <ul className="space-y-2">
          <li>
            <span
              onClick={dashboard}
              className={`block px-3 py-2 rounded cursor-pointer transition ${
                pathname === "/seller/dashboard"
                  ? "bg-red-600 text-white"
                  : "hover:text-red-400"
              }`}
            >
              Dashboard
            </span>
          </li>
          <li>
            <span
              onClick={addProduct}
              className={`block px-3 py-2 rounded cursor-pointer transition ${
                pathname === "/seller/addProduct"
                  ? "bg-red-600 text-white"
                  : "hover:text-red-400"
              }`}
            >
              Add Product
            </span>
          </li>
          <li>
            <span
              onClick={viewProduct}
              className={`block px-3 py-2 rounded cursor-pointer transition ${
                pathname === "/seller/viewProduct"
                  ? "bg-red-600 text-white"
                  : "hover:text-red-400"
              }`}
            >
              View Products
            </span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
