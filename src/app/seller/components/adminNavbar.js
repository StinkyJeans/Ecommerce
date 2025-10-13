"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const addProduct = () => {
    router.push("/admin/addProduct");
  };

  const viewProduct = () => {
    router.push("/admin/viewProduct");
  };

  return (
    <aside className="h-screen w-64 bg-gray-800 text-white p-6 flex flex-col justify-between">
      <div>
        <h1 className="text-xl font-bold mb-6">Stupid Shit</h1>

        <p className="text-gray-300">Category</p>
        <p className="mb-2">_______________________</p>
        <ul className="space-y-2">
          <li>
            <span
              onClick={addProduct}
              className="hover:text-red-400 cursor-pointer"
            >
              Add Product
            </span>
          </li>
          <li>
            <span
              onClick={viewProduct}
              className="hover:text-red-400 cursor-pointer"
            >
              View Products
            </span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
