"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ProductImage from "@/app/components/ProductImage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { formatPrice } from "@/lib/formatPrice";
import { productFunctions } from "@/lib/supabase/api";
import { getImageUrl } from "@/lib/supabase/storage";
import {
  faTrash,
  faEdit,
  faBoxes,
  faPlusCircle,
  faBoxOpen,
  faSpinner,
  faEye,
  faTimes,
  faCheckCircle,
  faExclamationCircle,
  faDesktop,
  faMobileAlt,
  faClock,
  faTag,
  faCalendar,
  faAlignLeft
} from "@fortawesome/free-solid-svg-icons";
import Navbar from "@/app/seller/components/sellerNavbar";

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

  const handleEdit = (product) => {
    const productId = product.product_id || product.productId || product.id || product._id;
    router.push(`/seller/editProduct?id=${productId}`);
  };

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
    if (!username || (role !== "seller" && role !== "admin")) {
      return;
    }
    fetchProducts();
  }, [username, role, router]);

  const fetchProducts = async () => {
    try {
      const data = await productFunctions.getSellerProducts(username);
      setProducts(data.products || []);
    } catch (e) {
      setErrorMessage("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setRemovingId(productId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await productFunctions.deleteProduct(productId, username);

      if (data.success) {
        setProducts((prevProducts) =>
          prevProducts.filter((product) => (product.product_id || product.productId || product.id || product._id) !== productId)
        );
        setSuccessMessage("Product deleted successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);

        if (selectedProduct && (selectedProduct.product_id || selectedProduct.productId || selectedProduct.id || selectedProduct._id) === productId) {
          closeModal();
        }
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

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Pc":
        return faDesktop;
      case "Mobile":
        return faMobileAlt;
      case "Watch":
        return faClock;
      default:
        return faBoxOpen;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -left-20 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-40 -right-20 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <Navbar />

      <main className="flex-1 p-4 sm:p-5 lg:p-6 overflow-auto mt-16 md:mt-0 relative">
        {successMessage && (
          <div className="max-w-7xl mx-auto mb-4 animate-in slide-in-from-top-2 fade-in">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-lg sm:text-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-green-800 font-semibold text-sm sm:text-base break-words">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage("")}
                className="text-green-600 hover:text-green-800 flex-shrink-0 p-1 touch-manipulation"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faTimes} className="text-sm sm:text-base" />
              </button>
            </div>
          </div>
        )}
        {errorMessage && (
          <div className="max-w-7xl mx-auto mb-4 animate-in slide-in-from-top-2 fade-in">
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <FontAwesomeIcon icon={faExclamationCircle} className="text-red-600 text-lg sm:text-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-red-800 font-semibold text-sm sm:text-base break-words">{errorMessage}</p>
              </div>
              <button
                onClick={() => setErrorMessage("")}
                className="text-red-600 hover:text-red-800 flex-shrink-0 p-1 touch-manipulation"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faTimes} className="text-sm sm:text-base" />
              </button>
            </div>
          </div>
        )}
        <div className="max-w-6xl mx-auto mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <FontAwesomeIcon icon={faBoxes} className="text-white text-lg sm:text-xl" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  My Products
                </h1>
                <p className="text-gray-600 text-xs sm:text-sm mt-0.5">
                  {products.length}{" "}
                  {products.length === 1 ? "product" : "products"} in your
                  inventory
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/seller/addProduct")}
              className="cursor-pointer px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 text-sm sm:text-base touch-manipulation w-full sm:w-auto"
            >
              <FontAwesomeIcon icon={faPlusCircle} />
              <span className="hidden sm:inline">Add New Product</span>
              <span className="sm:hidden">Add Product</span>
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="relative mb-6">
                <div className="h-20 w-20 border-4 border-red-200 rounded-full mx-auto"></div>
                <div className="h-20 w-20 border-4 border-t-red-600 rounded-full animate-spin absolute top-0 left-1/2 -translate-x-1/2"></div>
              </div>
              <p className="text-gray-700 font-semibold text-lg">
                Loading your products...
              </p>
              <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md text-center border border-gray-100">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FontAwesomeIcon icon={faBoxOpen} className="text-5xl text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  No Products Yet
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  You haven't added any products yet. Start building your
                  inventory now!
                </p>
                <button
                  onClick={() => router.push("/seller/addProduct")}
                  className="cursor-pointer px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlusCircle} />
                  Add Your First Product
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className={`group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden flex flex-col ${
                    removingId === product._id ? "opacity-50 scale-95" : ""
                  }`}
                >
                  <div className="relative h-56 overflow-hidden flex-shrink-0">
                    <Image
                      src={getImageUrl(product.id_url, 'product-images') || '/placeholder-image.jpg'}
                      alt={product.product_name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div className="absolute top-3 left-3">
                      <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                        <FontAwesomeIcon
                          icon={getCategoryIcon(product.category)}
                          className="text-red-600 text-sm"
                        />
                        <span className="text-xs font-semibold text-gray-700">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(product._id)}
                      disabled={removingId === product._id}
                      className="cursor-pointer absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-red-50 disabled:opacity-50"
                      title="Delete product"
                    >
                      {removingId === product._id ? (
                        <FontAwesomeIcon icon={faSpinner} className="text-red-600 animate-spin" />
                      ) : (
                        <FontAwesomeIcon
                          icon={faTrash}
                          className="text-red-600"
                        />
                      )}
                    </button>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900 truncate mb-2 group-hover:text-red-600 transition-colors">
                        {product.product_name}
                      </h2>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between mb-4 gap-2">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-xs text-gray-500 mb-1">Price</p>
                            <p className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent break-words overflow-wrap-anywhere">
                              ₱{formatPrice(product.price)}
                            </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Added</p>
                          <p className="text-xs font-semibold text-gray-700">
                            {new Date(product.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDetails(product)}
                      className="cursor-pointer w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-2.5 sm:py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base mt-auto"
                    >
                      <FontAwesomeIcon icon={faEye} />
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {viewModalOpen && selectedProduct && (
          <div 
            className="fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm z-50 p-2 sm:p-4 animate-in fade-in duration-200"
            onClick={closeModal}
          >
            <div 
              className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[90%] sm:max-w-md md:max-w-lg transform transition-all duration-300 animate-in zoom-in-95 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <div className="relative w-full h-40 sm:h-56 md:h-64">
                  <ProductImage
                    src={selectedProduct.id_url}
                    alt={selectedProduct.product_name}
                    className="object-cover rounded-t-xl sm:rounded-t-2xl"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, 512px"
                    priority
                  />
                </div>
                <button
                  onClick={closeModal}
                  className="cursor-pointer absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/95 hover:bg-white text-gray-800 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 backdrop-blur-sm touch-manipulation"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-lg sm:text-xl" />
                </button>

                <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
                  <div className="bg-white/95 backdrop-blur-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-xl">
                    <FontAwesomeIcon
                      icon={getCategoryIcon(selectedProduct.category)}
                      className="text-red-600 text-xs sm:text-sm"
                    />
                    <span className="font-semibold text-gray-800 text-xs sm:text-sm">
                      {selectedProduct.category}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-4 md:p-5">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white drop-shadow-2xl line-clamp-2">
                    {selectedProduct.product_name}
                  </h2>
                </div>
              </div>

              <div className="p-4 sm:p-5 md:p-6">
                <div className="mb-4 sm:mb-5">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                    <FontAwesomeIcon icon={faAlignLeft} className="mr-1.5 sm:mr-2 text-xs sm:text-sm" />
                    Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                    {selectedProduct.description || "No description available"}
                  </p>
                </div>

                <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 sm:mb-5 border border-red-100 overflow-hidden">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium flex items-center">
                        <FontAwesomeIcon icon={faTag} className="mr-1.5 sm:mr-2 text-xs sm:text-sm flex-shrink-0" />
                        Price
                      </p>
                      <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent break-words overflow-wrap-anywhere min-w-0">
                        ₱{formatPrice(selectedProduct.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1 font-medium flex items-center">
                        <FontAwesomeIcon icon={faCalendar} className="mr-1.5 sm:mr-2 text-xs sm:text-sm" />
                        Added On
                      </p>
                      <p className="text-sm sm:text-base md:text-lg font-bold text-gray-800">
                        {new Date(selectedProduct.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => handleEdit(selectedProduct)}
                    className="cursor-pointer flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 touch-manipulation"
                  >
                    <FontAwesomeIcon icon={faEdit} className="text-lg sm:text-xl" />
                    Edit Product
                  </button>
                  <button
                    onClick={() => handleDelete(selectedProduct._id)}
                    disabled={removingId === selectedProduct._id}
                    className="cursor-pointer flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation"
                  >
                    {removingId === selectedProduct._id ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="text-lg sm:text-xl animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faTrash} className="text-lg sm:text-xl" />
                        Delete Product
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
