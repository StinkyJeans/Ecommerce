"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "../components/sellerNavbar";
import { uploadProductImage } from "@/lib/supabase/storage";
import { productFunctions } from "@/lib/supabase/api";
import { getCategoryOptionsForForm } from "@/lib/categories";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import {
  Image,
  RefreshCw,
  Upload,
  CheckCircle,
  InfoCircle,
  Edit,
  Tag,
  AlignTextLeft,
  BanknoteDollar,
  Close,
  Monitor,
  Mobile,
  SmartWatch,
  Timer,
} from "griddy-icons";

function EditProductContent() {
  const [image, setImage] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [productId, setProductId] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username, role, loading: authLoading } = useAuth();

  useLoadingFavicon(authLoading || fetching || loading, "Edit Product");

  useEffect(() => {

    if (authLoading) {
      return;
    }

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
    const fetchProduct = async () => {
      const id = searchParams.get('id');
      if (!id) {
        router.push("/seller/viewProduct");
        return;
      }

      try {
        setFetching(true);
        const data = await productFunctions.getSellerProducts(username);

        if (data.products) {
          const product = data.products.find(p => 
            p.product_id === id || p.productId === id || p.id === id || p._id === id
          );

          if (product) {
            setProductId(product.product_id || product.productId || product.id || product._id);
            setProductName(product.product_name || product.productName || "");
            setDescription(product.description || "");
            setPrice(product.price || "");
            setCategory(product.category || "");
            setIdPreview(product.id_url || product.idUrl || null);
          } else {
            setPopupMessage("Product not found");
            setShowPopup(true);
            setTimeout(() => router.push("/seller/viewProduct"), 2000);
          }
        } else {
          setPopupMessage("Failed to load product data");
          setShowPopup(true);
          setTimeout(() => router.push("/seller/viewProduct"), 2000);
        }
      } catch (err) {
        setPopupMessage("Failed to load product");
        setShowPopup(true);
      } finally {
        setFetching(false);
      }
    };

    if (username && !authLoading) {
      fetchProduct();
    }
  }, [username, authLoading, searchParams, router]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setIdPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setIdPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let idUrl = idPreview;

    try {
      if (image) {
        idUrl = await uploadProductImage(image, username);
      }

      const data = await productFunctions.updateProduct({
        productId,
        productName,
        description,
        price,
        category,
        idUrl,
        username,
      });

      const isSuccess = data && 
        data.message && 
        data.success !== false && 
        !data.message.toLowerCase().includes('fail') && 
        !data.message.toLowerCase().includes('error') &&
        !data.error &&
        !data.errors;

      if (isSuccess) {
        setPopupMessage(data.message || "Product updated successfully!");
        setShowPopup(true);
        setTimeout(() => {
          router.push("/seller/viewProduct");
        }, 1500);
      } else {

        let errorMessage = "Failed to update product. Please try again.";

        if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          errorMessage = data.errors.join(". ");
        } else if (data?.error) {
          errorMessage = data.error;
        } else if (data?.message) {
          errorMessage = data.message;
        }

        setPopupMessage("Product update failed. " + errorMessage);
        setShowPopup(true);
      }
    } catch (err) {

      let errorMessage = "Failed to update product. Please try again.";

      if (err.response?.errors && Array.isArray(err.response.errors) && err.response.errors.length > 0) {
        errorMessage = err.response.errors.join(". ");
      } else if (err.response?.error) {
        errorMessage = err.response.error;
      } else if (err.response?.message) {
        errorMessage = err.response.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setPopupMessage("Product update failed. " + errorMessage);
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (cat) => {
    if (cat === "Pc" || (cat && cat.toLowerCase().includes("pc"))) return Monitor;
    if (cat === "Mobile" || (cat && cat.toLowerCase().includes("mobile"))) return Mobile;
    if (cat === "Watch" || (cat && cat.toLowerCase().includes("watch"))) return SmartWatch;
    return Tag;
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1a1a]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -left-20 w-96 h-96 bg-red-200 dark:bg-red-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-40 -right-20 w-96 h-96 bg-orange-200 dark:bg-orange-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>
      <Navbar />
      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col overflow-auto">
        {authLoading || fetching ? (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 border-4 border-t-transparent border-red-600 dark:border-red-400 rounded-full loading-spinner-animated" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading product...</p>
            </div>
          </div>
        ) : (
          <>
        <div className="z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="px-4 sm:px-5 lg:px-6 pt-3 sm:pt-4">
            <div className="py-4 sm:py-5 flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
                  Edit Product
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mt-1">
                  Update your product information
                </p>
              </div>
              <button
                onClick={() => router.push("/seller/viewProduct")}
                className="cursor-pointer px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 touch-manipulation"
              >
                <Close size={20} className="text-base sm:text-lg" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 sm:px-5 lg:px-6 py-5 sm:py-6">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 border border-gray-100 dark:border-gray-700">
              <div className="mb-5 sm:mb-6">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Product Image
                </label>
                <div className="relative w-full h-48 sm:h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  {idPreview ? (
                    <>
                      <img
                        src={idPreview}
                        alt="Product preview"
                        className="absolute inset-0 w-full h-full object-cover z-0"
                        style={{ minHeight: '100%', minWidth: '100%' }}
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 z-10 flex items-center justify-center">
                        <div className="opacity-0 hover:opacity-100 transition-opacity">
                          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                            <Image size={22} className="text-red-600 dark:text-red-400 text-xl" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                      <Upload size={40} className="text-4xl mb-2" />
                      <p className="text-sm">No image selected</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                </div>
                {idPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setIdPreview(null);
                    }}
                    className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 flex items-center gap-1"
                  >
                    <Close size={14} className="text-xs" />
                    Remove image
                  </button>
                )}
              </div>

              <div className="mb-5 sm:mb-6">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Tag size={16} className="text-red-600 dark:text-red-400 text-sm" />
                  Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter product name"
                />
              </div>

              <div className="mb-5 sm:mb-6">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <AlignTextLeft size={16} className="text-red-600 dark:text-red-400 text-sm" />
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows="4"
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none resize-none text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter product description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <BanknoteDollar size={16} className="text-red-600 dark:text-red-400 text-sm" />
                    Price
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    {(() => { const Icon = getCategoryIcon(category); return Icon ? <Icon size={16} className="text-red-600 dark:text-red-400 text-sm" /> : null; })()}
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Select category</option>
                    {getCategoryOptionsForForm().map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation"
              >
                {loading ? (
                  <>
                    <Timer size={22} className="text-lg sm:text-xl animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit size={22} className="text-lg sm:text-xl" />
                    Update Product
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 animate-in zoom-in-95 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {popupMessage.includes("success") ? <CheckCircle size={22} className="text-white text-xl" /> : <InfoCircle size={22} className="text-white text-xl" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
                    {popupMessage.includes("success") ? "Success!" : "Notice"}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{popupMessage}</p>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                >
                  <Close size={20} className="text-lg" />
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}

export default function EditProduct() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-white dark:bg-[#1a1a1a]">
        <Navbar />
        <main className="flex-1 relative mt-16 md:mt-0 flex flex-col overflow-auto">
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 border-4 border-t-transparent border-red-600 dark:border-red-400 rounded-full loading-spinner-animated" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    }>
      <EditProductContent />
    </Suspense>
  );
}
