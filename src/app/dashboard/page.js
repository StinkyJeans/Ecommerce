"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/navbar"; 
import SearchBar from "../components/searchbar";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Header from "../components/header";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [cartMessage, setCartMessage] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const router = useRouter();
  const { username } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/getProduct");
        const data = await res.json();
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(
      (product) =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setPopupVisible(true);
    setQuantity(1);
  };

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;

    if (!username) {
      setCartMessage("login");
      setTimeout(() => setCartMessage(""), 3000);
      return;
    }

    setAddingToCart(true);

    try {
      const res = await fetch("/api/addToCart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          productName: selectedProduct.productName,
          description: selectedProduct.description,
          price: selectedProduct.price,
          idUrl: selectedProduct.idUrl,
          quantity: quantity,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCartMessage("success");
        window.dispatchEvent(new Event("cartUpdated"));
        setTimeout(() => {
          setCartMessage("");
          closePopup();
        }, 2000);
      } else if (res.status === 409) {
        setCartMessage("exists");
        setTimeout(() => setCartMessage(""), 3000);
      } else {
        setCartMessage("error");
        setTimeout(() => setCartMessage(""), 3000);
      }
    } catch (err) {
      console.error("Add to cart failed:", err);
      setCartMessage("error");
      setTimeout(() => setCartMessage(""), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  const closePopup = () => {
    setPopupVisible(false);
    setSelectedProduct(null);
    setCartMessage("");
    setQuantity(1);
  };

  const calculateTotalPrice = () => {
    if (!selectedProduct) return "0.00";
    return (parseFloat(selectedProduct.price) * quantity).toFixed(2);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 -left-20 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-40 -right-20 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-700"></div>
      </div>

      <Navbar />

      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <Header />
            <div className="pb-4 pt-3">
              <div className="max-w-3xl mx-auto">
                <SearchBar
                  placeholder="🔍 Search products..."
                  onSearch={handleSearch}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="h-20 w-20 border-4 border-red-200 rounded-full mx-auto"></div>
                  <div className="h-20 w-20 border-4 border-t-red-600 rounded-full animate-spin absolute top-0 left-1/2 -translate-x-1/2"></div>
                </div>
                <p className="text-gray-700 font-semibold text-lg">Loading Products...</p>
                <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md border border-gray-100">
                <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-search text-5xl text-red-500"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {products.length === 0 ? "No Products Available" : "No Results Found"}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {products.length === 0
                    ? "Check back later for new products."
                    : "We couldn't find any products matching your search. Try different keywords."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-bold text-red-600 text-lg">{filteredProducts.length}</span>
                      <span className="ml-2 text-gray-500">
                        {filteredProducts.length === 1 ? "Product" : "Products"} Available
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`cursor-pointer px-4 py-2 rounded-lg transition-all ${
                      viewMode === "grid"
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <i className="fas fa-th mr-2"></i>Grid
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`cursor-pointer px-4 py-2 rounded-lg transition-all ${
                      viewMode === "list"
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <i className="fas fa-list mr-2"></i>List
                  </button>
                </div>
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200"
                    >
                      <div className="relative h-56 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        <img
                          src={product.idUrl}
                          alt={product.productName}
                          className="object-cover h-full w-full group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                            <i className="fas fa-eye text-red-600"></i>
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <h2 className="text-lg font-bold text-gray-900 truncate mb-2 group-hover:text-red-600 transition-colors">
                          {product.productName}
                        </h2>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Price</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                              ₱{product.price}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleView(product)}
                          className="cursor-pointer w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-eye"></i>
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200 flex flex-col sm:flex-row"
                    >
                      <div className="relative w-full sm:w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex-shrink-0">
                        <img
                          src={product.idUrl}
                          alt={product.productName}
                          className="object-cover h-full w-full group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                            {product.productName}
                          </h2>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                            {product.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Price</p>
                            <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                              ₱{product.price}
                            </p>
                          </div>
                          <button
                            onClick={() => handleView(product)}
                            className="cursor-pointer px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-red-800 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                          >
                            <i className="fas fa-eye"></i>
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {popupVisible && selectedProduct && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl transform transition-all duration-300 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <img
                  src={selectedProduct.idUrl}
                  alt={selectedProduct.productName}
                  className="w-full h-72 sm:h-96 object-cover rounded-t-3xl"
                />
                <button
                  onClick={closePopup}
                  className="cursor-pointer absolute top-4 right-4 bg-white/95 hover:bg-white text-gray-800 rounded-full w-12 h-12 flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-95 backdrop-blur-sm"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8">
                  <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-2xl">
                    {selectedProduct.productName}
                  </h2>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    <i className="fas fa-align-left mr-2"></i>Description
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-base">
                    {selectedProduct.description || "No description available"}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    <i className="fas fa-shopping-cart mr-2"></i>Quantity
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-2">
                      <button
                        onClick={decreaseQuantity}
                        className="cursor-pointer w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                      >
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <span className="w-16 text-center font-bold text-gray-800 text-xl">
                        {quantity}
                      </span>
                      <button
                        onClick={increaseQuantity}
                        className="cursor-pointer w-10 h-10 flex items-center justify-center bg-white rounded-lg hover:bg-green-50 hover:text-green-600 transition-all shadow-sm"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Available in stock</p>
                      <p className="text-sm text-green-600 font-semibold">
                        <i className="fas fa-check-circle mr-1"></i>Ready to ship
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 via-orange-50 to-red-50 rounded-2xl p-6 mb-6 border border-red-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">
                        <i className="fas fa-tag mr-2"></i>Unit Price
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        ₱{selectedProduct.price}
                      </p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm text-gray-600 mb-1 font-medium">×</p>
                      <p className="text-2xl font-bold text-gray-800">{quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1 font-medium">
                        <i className="fas fa-calculator mr-2"></i>Total
                      </p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                        ₱{calculateTotalPrice()}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={cartMessage !== "" || addingToCart}
                  className="cursor-pointer w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {addingToCart ? (
                    <>
                      <i className="fas fa-spinner fa-spin text-xl"></i>
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cart-plus text-xl"></i>
                      Add Item to Cart
                    </>
                  )}
                </button>

                {cartMessage && (
                  <div className="mt-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                    <div
                      className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                        cartMessage === "success"
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                          : cartMessage === "exists"
                          ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                          : cartMessage === "login"
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                          : "bg-gradient-to-r from-red-500 to-red-600 text-white"
                      }`}
                    >
                      <i
                        className={`fas ${
                          cartMessage === "success"
                            ? "fa-check-circle"
                            : cartMessage === "exists"
                            ? "fa-info-circle"
                            : cartMessage === "login"
                            ? "fa-user-lock"
                            : "fa-exclamation-circle"
                        } text-2xl`}
                      ></i>
                      <span>
                        {cartMessage === "success" &&
                          `${quantity} ${quantity === 1 ? "item" : "items"} added to cart successfully!`}
                        {cartMessage === "exists" &&
                          "Product quantity updated in your cart!"}
                        {cartMessage === "login" &&
                          "Please log in to add items to your cart."}
                        {cartMessage === "error" &&
                          "Failed to add product. Please try again."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}