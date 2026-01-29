"use client";

import { memo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import ProductImage from "./ProductImage";
import { formatPrice } from "@/lib/formatPrice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faShoppingCart } from "@fortawesome/free-solid-svg-icons";

// Lazy load heavy components
const ProductModal = dynamic(() => import("./ProductModal"), {
  loading: () => <div className="animate-pulse bg-[#E0E0E0] dark:bg-[#404040] rounded-lg h-96" />,
  ssr: false
});

const ProductCard = memo(({ product, onView, onAddToCart, isAddingToCart = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleView = useCallback(() => {
    onView?.(product);
  }, [product, onView]);

  return (
    <div className="group bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#E0E0E0] dark:border-[#404040] hover:border-[#FFBF00] flex flex-col transform hover:-translate-y-1">
      {/* Image Container with Lazy Loading */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden bg-white dark:bg-white/5">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 animate-pulse bg-[#E0E0E0] dark:bg-[#404040]" />
        )}
        <ProductImage
          src={product.idUrl || product.id_url}
          alt={product.productName || product.product_name}
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          priority={false}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick View Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button
            onClick={handleView}
            className="bg-white dark:bg-[#404040] rounded-full p-2.5 shadow-lg hover:bg-[#E0E0E0] dark:hover:bg-[#505050] hover:scale-110 transition-all"
            aria-label="View product details"
          >
            <FontAwesomeIcon icon={faEye} className="text-[#FFBF00] text-sm" />
          </button>
        </div>

        {/* Stock Badge */}
        {product.stock_quantity !== undefined && (
          <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
            product.stock_quantity > 0 && product.is_available
              ? "bg-[#4CAF50] text-white"
              : "bg-[#F44336] text-white"
          }`}>
            {product.stock_quantity > 0 && product.is_available ? "In Stock" : "Out of Stock"}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="font-bold text-base sm:text-lg text-[#2C2C2C] dark:text-[#e5e5e5] line-clamp-2 mb-2 group-hover:text-[#FFBF00] transition-colors min-h-[3rem]">
          {product.productName || product.product_name}
        </h3>
        
        <div className="mt-auto space-y-3">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-[#666666] dark:text-[#a3a3a3]">Price</span>
            <span className="text-xl sm:text-2xl font-bold text-[#FFBF00]">
              ₱{formatPrice(product.price)}
            </span>
          </div>

          {/* Seller Info */}
          <p className="text-xs text-[#666666] dark:text-[#a3a3a3] truncate">
            by <span className="font-medium text-[#2C2C2C] dark:text-[#e5e5e5]">{product.sellerUsername || product.seller_username}</span>
          </p>

          {/* Action Button */}
          <button
            onClick={handleView}
            disabled={isAddingToCart}
            className="w-full bg-[#FFBF00] hover:bg-[#e6ac00] text-[#2C2C2C] py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAddingToCart ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faShoppingCart} className="text-sm" />
                <span>View Details</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
