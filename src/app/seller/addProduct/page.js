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
        }, 2000);
      }
    } catch (err) {
      setPopupMessage("Adding of product failed. " + err.message);
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />

      <div className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 md:mt-0 overflow-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center text-red-600">
          Add Product
        </h1>

        <form
          onSubmit={handleSubmit}
          className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 bg-white p-4 sm:p-6 lg:p-8 rounded-md shadow-lg"
        >
          {/* Image Upload Section */}
          <div className="flex flex-col">
            <label className="mb-2 text-gray-700 font-medium text-sm sm:text-base">
              Upload Product Image
            </label>
            <div
              className="w-full min-h-[16rem] sm:min-h-[20rem] lg:min-h-[24rem] max-h-[32rem] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition overflow-hidden"
              onClick={() => document.getElementById("idFileInput").click()}
            >
              {idPreview ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={idPreview}
                    alt="Product Preview"
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="text-center p-4">
                  <p className="text-gray-400 text-sm sm:text-base">
                    Click here to upload image
                  </p>
                  <p className="text-gray-300 text-xs mt-2">
                    Supports: JPG, PNG, GIF
                  </p>
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
          </div>

          {/* Form Fields Section */}
          <div className="space-y-3 sm:space-y-4 flex flex-col">
            <input
              type="text"
              placeholder="Product Name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-sm sm:text-base"
              required
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition h-24 sm:h-28 lg:h-32 resize-none text-sm sm:text-base flex-grow"
              required
            />

            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition text-sm sm:text-base"
              required
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white cursor-pointer text-sm sm:text-base"
              required
            >
              <option value="">Select Category</option>
              <option value="Pc">Pc</option>
              <option value="Mobile">Mobile</option>
              <option value="Watch">Watch</option>
            </select>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-base sm:text-lg font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      {/* Success/Error Popup */}
      {showPopup && (
        <div className="fixed top-5 right-5 bg-gray-800 text-white px-4 py-3 rounded shadow-lg animate-fade-in z-50 max-w-xs text-sm sm:text-base">
          {popupMessage}
        </div>
      )}
    </div>
  );
}