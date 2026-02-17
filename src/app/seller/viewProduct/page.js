"use client";

import { useEffect, useState } from "react";
import ProductImage from "@/app/components/ProductImage";
import { getFirstImageUrl } from "@/lib/supabase/storage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { formatPrice } from "@/lib/formatPrice";
import { productFunctions } from "@/lib/supabase/api";
import {
  Trash,
  Edit,
  PlusCircle,
  Package,
  Timer,
  Eye,
  Close,
  CheckCircle,
  AlertCircle,
  Tag,
  AlignTextLeft,
} from "griddy-icons";
import Navbar from "../components/sellerNavbar";
import Header from "@/app/components/header";

export default function ViewProduct() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const { username, role, loading: authLoading } = useAuth();
  const router = useRouter();

  useLoadingFavicon(authLoading || loading, "My Products");

  const pid = (p) => p?.product_id || p?.productId || p?.id || p?._id;

  const handleEdit = (product) => {
    router.push(`/seller/editProduct?id=${pid(product)}`);
  };

  useEffect(() => {
    if (authLoading) return;
    if (role && role !== "seller" && role !== "admin") {
      router.push("/");
      return;
    }
    if (!role) {
      router.push("/");
      return;
    }
  }, [username, role, authLoading, router]);

  useEffect(() => {
    if (!username || (role !== "seller" && role !== "admin")) return;
    fetchProducts();
  }, [username, role]);

  const fetchProducts = async (isRetry) => {
    try {
      setErrorMessage("");
      const data = await productFunctions.getSellerProducts(username);
      setProducts(data.products || []);
    } catch (e) {
      const msg = e?.message || "Failed to load products";
      if (!isRetry && e?.status === 403 && (msg.toLowerCase().includes("signing") || msg.toLowerCase().includes("signature"))) {
        await new Promise((r) => setTimeout(r, 800));
        return fetchProducts(true);
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setRemovingId(productId);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const data = await productFunctions.deleteProduct(productId, username);
      if (data.success) {
        setProducts((prev) => prev.filter((p) => pid(p) !== productId));
        setSuccessMessage("Product deleted successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        if (selectedProduct && pid(selectedProduct) === productId) closeModal();
      } else {
        setErrorMessage(data.message || "Failed to delete product");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      setErrorMessage(`Error: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setRemovingId(null);
    }
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  const closeModal = () => {
    setViewModalOpen(false);
    setSelectedProduct(null);
  };

  const getCategoryIcon = (c) => {
    if (c === "Pc") return faDesktop;
    if (c === "Mobile") return faMobileAlt;
    if (c === "Watch") return faClock;
    return faBoxOpen;
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1a1a]">
      <Navbar />

      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col">
        <div className="z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <Header />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="p-8">
          {successMessage && (
            <div className="mb-4 flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
              <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-300 font-semibold flex-1">{successMessage}</p>
              <button onClick={() => setSuccessMessage("")} className="text-green-600 dark:text-green-400 hover:text-green-800">
                <Close size={18} />
              </button>
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-300 font-semibold flex-1">{errorMessage}</p>
              <button onClick={() => setErrorMessage("")} className="text-red-600 dark:text-red-400 hover:text-red-800">
                <Close size={18} />
              </button>
            </div>
          )}

          <div className="mb-4">
            <nav className="text-sm text-gray-500 dark:text-gray-400">
              <span className="hover:text-orange-500 cursor-pointer" onClick={() => router.push("/seller/dashboard")}>Seller Portal</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">My Products</span>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Inventory</h1>
              <p className="text-gray-600 dark:text-gray-400">{products.length} {products.length === 1 ? "product" : "products"}</p>
            </div>
            <button
              onClick={() => router.push("/seller/addProduct")}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <PlusCircle size={20} />
              Add Product
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-12 w-12 border-4 border-t-transparent border-orange-500 dark:border-orange-400 rounded-full loading-spinner-animated mb-4" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={40} className="text-4xl text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No products yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Add your first product to start selling.</p>
              <button
                onClick={() => router.push("/seller/addProduct")}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-semibold transition-all"
              >
                <PlusCircle size={18} className="mr-2" />
                Add Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={pid(product)}
                  className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg transition-all ${removingId === pid(product) ? "opacity-50" : ""}`}
                >
                  <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-700 group">
                    <ProductImage
                      src={getFirstImageUrl(product.id_url)}
                      alt={product.product_name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-white/90 dark:bg-gray-800/90 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {product.category || "—"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(pid(product))}
                      disabled={removingId === pid(product)}
                      className="absolute top-3 right-3 w-9 h-9 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 disabled:opacity-50"
                    >
                      {removingId === pid(product) ? <Timer size={16} className="animate-spin" /> : <Trash size={16} />}
                    </button>
                  </div>
                  <div className="p-4">
                    <h2 className="font-bold text-gray-900 dark:text-gray-100 truncate mb-1">{product.product_name}</h2>
                    <p className="text-sm text-orange-500 font-bold mb-3">₱{formatPrice(product.price)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{new Date(product.created_at || product.createdAt).toLocaleDateString()}</p>
                    <button
                      onClick={() => handleViewDetails(product)}
                      className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <Eye size={18} />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {viewModalOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <div className="relative h-56">
                  <ProductImage src={getFirstImageUrl(selectedProduct.id_url)} alt={selectedProduct.product_name} className="object-cover w-full h-full rounded-t-2xl" sizes="512px" priority />
                </div>
                <button onClick={closeModal} className="absolute top-3 right-3 w-10 h-10 bg-white/95 dark:bg-gray-800/95 rounded-full flex items-center justify-center shadow" aria-label="Close">
                  <Close size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 bg-white/95 dark:bg-gray-800/95 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200">{selectedProduct.category || "—"}</span>
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{selectedProduct.product_name}</h2>
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlignTextLeft size={18} /> Description
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{selectedProduct.description || "No description"}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mb-6 border border-orange-200 dark:border-orange-800">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Price</p>
                      <p className="text-lg font-bold text-orange-600 dark:text-orange-400">₱{formatPrice(selectedProduct.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Added</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{new Date(selectedProduct.created_at || selectedProduct.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleEdit(selectedProduct)} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                    <Edit size={18} />
                    Edit
                  </button>
                  <button onClick={() => handleDelete(pid(selectedProduct))} disabled={removingId === pid(selectedProduct)} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                    {removingId === pid(selectedProduct) ? <Timer size={16} className="animate-spin" /> : <Trash size={16} />}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
    </main>
  </div>
  );
}
