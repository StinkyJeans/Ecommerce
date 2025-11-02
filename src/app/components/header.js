import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import SearchBar from "./searchbar";

export default function Header() {
  const router = useRouter();
  const { logout, username } = useAuth();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    logout();
    router.replace("/");
  };

  return (
    <div className="sticky top-0 pb-4 pt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-600">
        Featured Products
      </h1>
      <div className="flex items-center gap-3 sm:gap-5">
        <FontAwesomeIcon
          icon={faShoppingCart}
          className="text-red-600 text-xl sm:text-2xl cursor-pointer hover:text-red-700 transition"
          onClick={() => router.push("/cart/viewCart")}
        />
        <span className="font-semibold text-gray-700 text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
          👤 {username || "Loading..."}
        </span>
        <button
          onClick={handleLogout}
          className="px-3 sm:px-5 py-2 bg-red-600 rounded text-white hover:bg-red-700 transition cursor-pointer text-sm sm:text-base whitespace-nowrap"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
