"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/sellerNavbar";
import { uploadProductImage } from "@/lib/supabase/storage";
import { productFunctions } from "@/lib/supabase/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faImage,
  faSyncAlt,
  faCloudUploadAlt,
  faCheckCircle,
  faInfoCircle,
  faEdit,
  faTag,
  faAlignLeft,
  faDollarSign,
  faFolder,
  faPlusCircle,
  faLightbulb,
  faStar,
  faTimes,
  faDesktop,
  faMobileAlt,
  faClock
} from "@fortawesome/free-solid-svg-icons";

export default function AddProduct() {
  const [image, setImage] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();
  const { username, role, loading: authLoading } = useAuth();

  useLoadingFavicon(authLoading || loading, "Add Product");

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
    let idUrl = "";

    try {
      if (image) {

        const formData = new FormData();
        formData.append('file', image);
        formData.append('sellerUsername', username);

        const uploadResponse = await fetch('/api/upload-product-image', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload image');
        }

        idUrl = uploadData.url;
      }

      const data = await productFunctions.addProduct({
        productName,
        description,
        price,
        category,
        idUrl,
        username,
      });

      const isSuccess = data && (
        data.productId || 
        (
          data.message && 
          !data.message.toLowerCase().includes('fail') && 
          !data.message.toLowerCase().includes('error') && 
          data.success !== false &&
          !data.error &&
          !data.errors
        )
      );

      if (isSuccess) {
        setPopupMessage(data.message || "Product added successfully!");
        setShowPopup(true);

        setProductName("");
        setDescription("");
        setPrice("");
        setCategory("");
        setImage(null);
        setIdPreview(null);

        setTimeout(() => {
          setShowPopup(false);
        }, 3000);
      } else {

        let errorMessage = "Failed to add product. Please try again.";

        if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          errorMessage = data.errors.join(". ");
        } else if (data?.error) {
          errorMessage = data.error;
        } else if (data?.message) {
          errorMessage = data.message;
        }

        setPopupMessage("Adding of product failed. " + errorMessage);
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
        }, 5000);
      }
    } catch (err) {

      let errorMessage = "Failed to add product. Please try again.";

      if (err.response?.errors && Array.isArray(err.response.errors) && err.response.errors.length > 0) {
        errorMessage = err.response.errors.join(". ");
      } else if (err.response?.message) {
        errorMessage = err.response.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setPopupMessage("Adding of product failed. " + errorMessage);
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "Pc", icon: "fa-desktop", label: "PC & Computers" },
    { value: "Mobile", icon: "fa-mobile-alt", label: "Mobile Devices" },
    { value: "Watch", icon: "fa-watch", label: "Watches" },
  ];

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#1a1a1a]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -left-20 w-96 h-96 bg-red-200 dark:bg-red-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-40 -right-20 w-96 h-96 bg-orange-200 dark:bg-orange-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <Navbar />

      <div className="flex-1 p-4 sm:p-5 lg:p-6 mt-16 md:mt-0 overflow-auto relative">
        <div className="max-w-5xl mx-auto mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <FontAwesomeIcon icon={faPlus} className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
                Add New Product
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
                Fill in the details to add a product to your inventory
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faImage} className="text-red-600 dark:text-red-400" />
              <label className="text-gray-800 dark:text-gray-200 font-semibold text-base">
                Product Image
              </label>
            </div>

            <div
              className="relative w-full h-56 sm:h-64 md:h-72 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all overflow-hidden group touch-manipulation"
              onClick={() => document.getElementById("idFileInput").click()}
            >
              {idPreview ? (
                <>
                  <img
                    src={idPreview}
                    alt="Product Preview"
                    className="absolute inset-0 w-full h-full object-cover rounded-xl"
                    style={{ minHeight: '100%', minWidth: '100%' }}
                  />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center rounded-xl z-10">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                        <FontAwesomeIcon icon={faSyncAlt} className="text-white text-4xl mb-2" />
                        <p className="text-white font-semibold">Change Image</p>
                      </div>
                    </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faCloudUploadAlt} className="text-4xl text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-semibold mb-2 text-lg">
                    Upload Product Image
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                    Click to browse or drag and drop
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 dark:text-green-400" />
                    <span>JPG, PNG, GIF supported</span>
                  </div>
                </div>
              )}
            </div>

            <input
              id="idFileInput"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              required
            />

            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 dark:text-blue-400" />
              Recommended: High-quality images with 1:1 aspect ratio
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <FontAwesomeIcon icon={faEdit} className="text-red-600 dark:text-red-400" />
              <h2 className="text-gray-800 dark:text-gray-200 font-semibold text-base">
                Product Details
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FontAwesomeIcon icon={faTag} className="mr-2 text-gray-400 dark:text-gray-500" />
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FontAwesomeIcon icon={faAlignLeft} className="mr-2 text-gray-400 dark:text-gray-500" />
                  Description
                </label>
                <textarea
                  placeholder="Describe your product in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all h-32 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {description.length}/500 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FontAwesomeIcon icon={faDollarSign} className="mr-2 text-gray-400 dark:text-gray-500" />
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">
                    ₱
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FontAwesomeIcon icon={faFolder} className="mr-2 text-gray-400 dark:text-gray-500" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "1.5em 1.5em",
                    paddingRight: "2.5rem",
                  }}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full py-3 sm:py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl text-base sm:text-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 mt-6 sm:mt-8 touch-manipulation"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding Product...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlusCircle} />
                    <span>Add Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="max-w-5xl mx-auto mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faLightbulb} className="text-blue-600 dark:text-blue-400 text-xl mt-1" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">
                  Pro Tip
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Use high-quality images to increase buyer interest
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 dark:text-green-400 text-xl mt-1" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">
                  Best Practice
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Write detailed descriptions to improve sales
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faStar} className="text-purple-600 dark:text-purple-400 text-xl mt-1" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">
                  Pricing Tip
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Competitive pricing helps attract more customers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className={`fixed top-5 right-5 px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-top-2 fade-in z-50 max-w-md flex items-center gap-3 ${
          popupMessage.toLowerCase().includes('fail') || popupMessage.toLowerCase().includes('error')
            ? 'bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white'
        }`}>
          <FontAwesomeIcon 
            icon={popupMessage.toLowerCase().includes('fail') || popupMessage.toLowerCase().includes('error') ? faInfoCircle : faCheckCircle} 
            className="text-2xl flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold break-words">{popupMessage}</p>
            {!popupMessage.toLowerCase().includes('fail') && !popupMessage.toLowerCase().includes('error') && (
              <p className="text-xs opacity-90 mt-1">
                Your product has been added successfully
              </p>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center">
            <div className="relative mb-4">
              <div className="h-16 w-16 border-4 border-red-200 dark:border-red-800 rounded-full mx-auto"></div>
              <div className="h-16 w-16 border-4 border-t-red-600 dark:border-t-red-400 rounded-full animate-spin absolute top-0 left-1/2 -translate-x-1/2"></div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-semibold text-lg">
              Adding Product
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Please wait...</p>
          </div>
        </div>
      )}
    </div>
  );
}
