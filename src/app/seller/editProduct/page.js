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
  Package,
  Plus,
} from "griddy-icons";

function EditProductContent() {
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
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
            setStockQuantity(product.stock_quantity != null ? String(product.stock_quantity) : "");
            
            // Parse existing images (support both single URL and JSON array)
            const idUrl = product.id_url || product.idUrl || "";
            let parsedImages = [];
            try {
              const parsed = JSON.parse(idUrl);
              if (Array.isArray(parsed)) {
                parsedImages = parsed;
              } else {
                parsedImages = idUrl ? [idUrl] : [];
              }
            } catch {
              parsedImages = idUrl ? [idUrl] : [];
            }
            setExistingImages(parsedImages);
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
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const updatedImages = [...newImages];
      const updatedPreviews = [...newImagePreviews];
      
      files.forEach((file) => {
        if (file.type.startsWith('image/')) {
          // Check if adding this file would exceed the 5 image limit (existing + new)
          const totalImages = existingImages.length + updatedImages.length;
          if (totalImages >= 5) {
            setPopupMessage("Maximum 5 images allowed per product");
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 3000);
            return;
          }
          updatedImages.push(file);
          const reader = new FileReader();
          reader.onloadend = () => {
            updatedPreviews.push(reader.result);
            setNewImagePreviews([...updatedPreviews]);
          };
          reader.readAsDataURL(file);
        }
      });
      
      setNewImages(updatedImages);
    }
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (existingImages.length === 0 && newImages.length === 0) {
      setPopupMessage("Please upload at least one product image");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      return;
    }
    
    const totalImages = existingImages.length + newImages.length;
    if (totalImages > 5) {
      setPopupMessage("Maximum 5 images allowed per product");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
      return;
    }
    
    setLoading(true);
    let idUrl = "";

    try {
      // Upload new images
      const uploadedUrls = [];
      for (const image of newImages) {
        const url = await uploadProductImage(image, username);
        uploadedUrls.push(url);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedUrls];
      
      // Store as JSON array if multiple images, single string if one image
      idUrl = allImages.length === 1 ? allImages[0] : JSON.stringify(allImages);

      const data = await productFunctions.updateProduct({
        productId,
        productName,
        description,
        price,
        category,
        idUrl,
        username,
        stockQuantity: stockQuantity !== "" && stockQuantity != null ? parseInt(stockQuantity, 10) : 0,
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
                  Product Images
                </label>
                
                {(existingImages.length > 0 || newImagePreviews.length > 0) ? (
                  <div className="space-y-4">
                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Current Images</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {existingImages.map((imageUrl, index) => (
                            <div key={`existing-${index}`} className="relative group">
                              <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                                <img
                                  src={imageUrl}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeExistingImage(index);
                                  }}
                                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                  aria-label="Remove image"
                                >
                                  <Close size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* New Images */}
                    {newImagePreviews.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">New Images</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {newImagePreviews.map((preview, index) => (
                            <div key={`new-${index}`} className="relative group">
                              <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                                <img
                                  src={preview}
                                  alt={`New product preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNewImage(index);
                                  }}
                                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                  aria-label="Remove image"
                                >
                                  <Close size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => document.getElementById("editFileInput").click()}
                      className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-red-500 dark:hover:border-red-500 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={20} />
                      Add More Images
                    </button>
                  </div>
                ) : (
                  <div
                    className="relative w-full h-48 sm:h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all"
                    onClick={() => document.getElementById("editFileInput").click()}
                  >
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Upload size={32} className="text-3xl text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 font-semibold mb-1 text-base">
                        Upload Product Images
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Click to browse (multiple images supported)
                      </p>
                    </div>
                  </div>
                )}
                
                <input
                  id="editFileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Upload multiple images to showcase your product (max 5 images). First image will be the main display image.
                </p>
                {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                    {existingImages.length + newImagePreviews.length} / 5 images
                  </p>
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

              <div className="mb-5 sm:mb-6">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Package size={16} className="text-red-600 dark:text-red-400 text-sm" />
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  min="0"
                  step="1"
                  required
                  className="w-full px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Enter stock quantity"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter the number of items available. Set to 0 if out of stock.
                </p>
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
