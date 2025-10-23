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
        // ✅ Clear fields after success
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
    <div className="flex min-h-screen bg-gray-50 relative">
      <Navbar />

      <div className="flex-1 p-10">
        <h1 className="text-4xl font-bold mb-8 text-center text-red-600">
          Add Product
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white p-8 rounded-md shadow-lg border-1"
        >
          <div className="flex-1 flex flex-col items-center">
            <label className="mb-2 text-gray-700 font-medium">
              Upload Product Image
            </label>
            <div
              className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
              onClick={() => document.getElementById("idFileInput").click()}
            >
              {idPreview ? (
                <img
                  src={idPreview}
                  alt="ID Preview"
                  className="w-[50%] h-[100%] object-cover rounded-lg"
                />
              ) : (
                <p className="text-gray-400">Click here to upload image</p>
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

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Product Name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition h-28 resize-none"
              required
            />

            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none transition bg-white cursor-pointer"
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
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-lg transition cursor-pointer disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      {showPopup && (
        <div className="absolute top-5 right-5 bg-gray-800 text-white px-4 py-2 rounded shadow-lg animate-fade-in">
          {popupMessage}
        </div>
      )}
    </div>
  );
}
