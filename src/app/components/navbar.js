"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter ()

const dashboard = () => router.push("/dashboard");

  return (
    <aside className="h-screen w-64 bg-gray-800 text-white p-6 flex flex-col justify-between">
      <div>
        <h1 onClick={dashboard} className="text-xl font-bold mb-6 cursor-pointer">Stupid Shit</h1>

        <p className="text-gray-300">Category</p>
        <p className="mb-2">_______________________</p>
        <ul className="space-y-2">
          <li>
            <a href="#" className="hover:text-red-400">
              PC
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-red-400">
              Mobile
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-red-400">
              Watch
            </a>
          </li>
        </ul>
      </div>

      
    </aside>
  );
}
