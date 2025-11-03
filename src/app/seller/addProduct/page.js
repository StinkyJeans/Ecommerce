"use client";

import { useState } from "react";
import Navbar from "../components/sellerNavbar";
import { useEdgeStore } from "@/lib/edgestore";
import { useRouter } from "next/navigation";

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
  const { edgestore } = useEdgeStore();
  const router = useRouter();

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
        const res = await edgestore.publicFiles.upload({ file: image });
        idUrl = res.url;
      }

      const response = await fetch("/api/goods/addProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          description,
          price,
          category,
          idUrl,
        }),
      });

      const data = await response.json();
      setPopupMessage(data.message);
      setShowPopup(true);

      if (response.ok) {
        setProductName("");
        setDescription("");
        setPrice("");
        setCategory("");
        setImage(null);
        setIdPreview(null);

        setTimeout(() => {
          setShowPopup(false);
        }, 3000);
      }
    } catch (err) {
      setPopupMessage("Adding of product failed. " + err.message);
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
      }, 3000);
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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -left-20 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-40 -right-20 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <Navbar />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 md:mt-0 overflow-auto relative">
        <div className="max-w-6xl mx-auto mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <i className="fas fa-plus text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Add New Product
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Fill in the details to add a product to your inventory
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <i className="fas fa-image text-red-600"></i>
              <label className="text-gray-800 font-semibold text-lg">
                Product Image
              </label>
            </div>

            <div
              className="relative w-full h-80 sm:h-96 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all overflow-hidden group"
              onClick={() => document.getElementById("idFileInput").click()}
            >
              {idPreview ? (
                <>
                  <img
                    src={idPreview}
                    alt="Product Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                      <i className="fas fa-sync-alt text-white text-4xl mb-2"></i>
                      <p className="text-white font-semibold">Change Image</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-cloud-upload-alt text-4xl text-red-600"></i>
                  </div>
                  <p className="text-gray-700 font-semibold mb-2 text-lg">
                    Upload Product Image
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    Click to browse or drag and drop
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <i className="fas fa-check-circle text-green-500"></i>
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

            <p className="mt-4 text-xs text-gray-500 flex items-center gap-2">
              <i className="fas fa-info-circle text-blue-500"></i>
              Recommended: High-quality images with 1:1 aspect ratio
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <i className="fas fa-edit text-red-600"></i>
              <h2 className="text-gray-800 font-semibold text-lg">
                Product Details
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-tag mr-2 text-gray-400"></i>
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-align-left mr-2 text-gray-400"></i>
                  Description
                </label>
                <textarea
                  placeholder="Describe your product in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all h-32 resize-none"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  {description.length}/500 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-dollar-sign mr-2 text-gray-400"></i>
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    ₱
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-folder mr-2 text-gray-400"></i>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white cursor-pointer appearance-none"
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
                className="cursor-pointer w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-8"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding Product...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus-circle"></i>
                    <span>Add Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <div className="max-w-6xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-lightbulb text-blue-600 text-xl mt-1"></i>
              <div>
                <p className="font-semibold text-gray-800 text-sm mb-1">
                  Pro Tip
                </p>
                <p className="text-xs text-gray-600">
                  Use high-quality images to increase buyer interest
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-check-circle text-green-600 text-xl mt-1"></i>
              <div>
                <p className="font-semibold text-gray-800 text-sm mb-1">
                  Best Practice
                </p>
                <p className="text-xs text-gray-600">
                  Write detailed descriptions to improve sales
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-star text-purple-600 text-xl mt-1"></i>
              <div>
                <p className="font-semibold text-gray-800 text-sm mb-1">
                  Pricing Tip
                </p>
                <p className="text-xs text-gray-600">
                  Competitive pricing helps attract more customers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed top-5 right-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-in slide-in-from-top-2 fade-in z-50 max-w-md flex items-center gap-3">
          <i className="fas fa-check-circle text-2xl"></i>
          <div>
            <p className="font-semibold">{popupMessage}</p>
            <p className="text-xs text-green-100 mt-1">
              Your product has been added successfully
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="relative mb-4">
              <div className="h-16 w-16 border-4 border-red-200 rounded-full mx-auto"></div>
              <div className="h-16 w-16 border-4 border-t-red-600 rounded-full animate-spin absolute top-0 left-1/2 -translate-x-1/2"></div>
            </div>
            <p className="text-gray-700 font-semibold text-lg">
              Adding Product
            </p>
            <p className="text-gray-500 text-sm mt-1">Please wait...</p>
          </div>
        </div>
      )}
    </div>
  );
}
