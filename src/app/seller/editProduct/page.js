"use client";

import { useState, useEffect, Suspense } from "react";
import Navbar from "../components/sellerNavbar";
import { uploadProductImage } from "@/lib/supabase/storage";
import { productFunctions } from "@/lib/supabase/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faSyncAlt,
  faCloudUploadAlt,
  faCheckCircle,
  faInfoCircle,
  faEdit,
  faTag,
  faAlignLeft,
  faDollarSign,
  faTimes,
  faDesktop,
  faMobileAlt,
  faClock,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";

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
    // Wait for auth to finish loading before checking
    if (authLoading) {
      return;
    }
    
    // Only redirect if role is explicitly not seller/admin
    if (role && role !== "seller" && role !== "admin") {
      router.push("/");
      return;
    }
    
    // If no role at all after loading, redirect
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

      setPopupMessage(data.message || "Product updated successfully!");
      setShowPopup(true);
      setTimeout(() => {
        router.push("/seller/viewProduct");
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.message || err.message || "Failed to update product. Please try again.";
      setPopupMessage(errorMessage);
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (cat) => {
    if (cat === "Pc" || cat === "Computers") return faDesktop;
    if (cat === "Mobile" || cat === "Mobile Phones") return faMobileAlt;
    if (cat === "Watch" || cat === "Watches") return faClock;
    return faTag;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      <Navbar />
      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col overflow-auto">
        {authLoading || fetching ? (
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Loading product...</p>
            </div>
          </div>
        ) : (
          <>
        <div className="z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="px-4 sm:px-5 lg:px-6 pt-3 sm:pt-4">
            <div className="py-4 sm:py-5 flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Edit Product
                </h1>
                <p className="text-gray-600 text-sm sm:text-base mt-1">
                  Update your product information
                </p>
              </div>
              <button
                onClick={() => router.push("/seller/viewProduct")}
                className="cursor-pointer px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 touch-manipulation"
              >
                <FontAwesomeIcon icon={faTimes} className="text-base sm:text-lg" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 sm:px-5 lg:px-6 py-5 sm:py-6">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 md:p-8 border border-gray-100">
              <div className="mb-5 sm:mb-6">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                  Product Image
                </label>
                <div className="relative w-full h-48 sm:h-64 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
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
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                            <FontAwesomeIcon icon={faImage} className="text-red-600 text-xl" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="text-4xl mb-2" />
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
                    className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    Remove image
                  </button>
                )}
              </div>

              <div className="mb-5 sm:mb-6">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faTag} className="text-red-600 text-sm" />
                  Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm sm:text-base"
                  placeholder="Enter product name"
                />
              </div>

              <div className="mb-5 sm:mb-6">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FontAwesomeIcon icon={faAlignLeft} className="text-red-600 text-sm" />
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows="4"
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none resize-none text-sm sm:text-base"
                  placeholder="Enter product description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={faDollarSign} className="text-red-600 text-sm" />
                    Price
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FontAwesomeIcon icon={getCategoryIcon(category)} className="text-red-600 text-sm" />
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm sm:text-base bg-white"
                  >
                    <option value="">Select category</option>
                    <option value="Pc">Computers & Laptops</option>
                    <option value="Mobile">Mobile Devices</option>
                    <option value="Watch">Watches</option>
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
                    <FontAwesomeIcon icon={faSpinner} className="text-lg sm:text-xl animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faEdit} className="text-lg sm:text-xl" />
                    Update Product
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 animate-in zoom-in-95">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon
                    icon={popupMessage.includes("success") ? faCheckCircle : faInfoCircle}
                    className="text-white text-xl"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                    {popupMessage.includes("success") ? "Success!" : "Notice"}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">{popupMessage}</p>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-lg" />
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
      <div className="flex min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
        <Navbar />
        <main className="flex-1 relative mt-16 md:mt-0 flex flex-col overflow-auto">
          <div className="flex-1 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    }>
      <EditProductContent />
    </Suspense>
  );
}
