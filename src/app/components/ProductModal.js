"use client";

import { memo, useState, useCallback } from "react";
import ProductImage from "./ProductImage";
import { formatPrice } from "@/lib/formatPrice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faPlus,
  faMinus,
  faShoppingCart,
  faSpinner,
  faTag,
  faStore,
  faTruck,
  faShieldHalved,
  faBox,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

const ProductModal = memo(({ product, onClose, onAddToCart, isAddingToCart = false, username, initialQuantity = 1 }) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [descExpanded, setDescExpanded] = useState(false);

  const increaseQuantity = useCallback(() => {
    setQuantity((prev) => prev + 1);
  }, []);

  const decreaseQuantity = useCallback(() => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  }, []);

  const handleAddToCart = useCallback(() => {
    if (product && onAddToCart) {
      onAddToCart(product, quantity);
    }
  }, [product, quantity, onAddToCart]);

  const calculateTotalPrice = () => {
    if (!product) return "0.00";
    return (parseFloat(product.price) * quantity).toFixed(2);
  };

  if (!product) return null;

  const name = product.productName || product.product_name;
  const desc = product.description || "No description available.";
  const seller = product.sellerUsername || product.seller_username;
  const category = product.category;
  const shortDesc = desc.length > 160 ? desc.slice(0, 160) + "…" : desc;
  const hasLongDesc = desc.length > 160;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center bg-black/70 backdrop-blur-md z-50 p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#2C2C2C] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] overflow-hidden flex flex-col sm:flex-row animate-in zoom-in-95 duration-200 border border-[#E0E0E0] dark:border-[#404040]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ——— Image (left on desktop) ——— */}
        <div className="relative flex-shrink-0 w-full sm:w-[48%] lg:w-[45%] aspect-square sm:aspect-auto sm:min-h-[420px] bg-white dark:bg-white/5">
          <ProductImage
            src={product.idUrl || product.id_url}
            alt={name}
            className="object-cover w-full h-full"
            sizes="(max-width: 640px) 100vw, 420px"
            priority
          />
          {/* Overlays */}
          {category && (
            <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-[#404040] text-[#2C2C2C] dark:text-[#e5e5e5] shadow-lg backdrop-blur-sm border border-[#E0E0E0] dark:border-[#404040]">
              {category}
            </span>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white dark:bg-[#404040] shadow-lg flex items-center justify-center text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-[#E0E0E0] dark:hover:bg-[#505050] transition-colors border border-[#E0E0E0] dark:border-[#404040]"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} className="text-lg" />
          </button>
        </div>

        {/* ——— Details (right on desktop) ——— */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <div className="p-5 sm:p-6 lg:p-8">
            {/* Title & meta */}
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5] tracking-tight pr-10 -mt-1 sm:mt-0">
              {name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-[#666666] dark:text-[#a3a3a3]">
              {seller && (
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faStore} className="text-[#FFBF00]" />
                  Sold by <span className="font-medium text-[#2C2C2C] dark:text-[#e5e5e5]">{seller}</span>
                </span>
              )}
              {category && !seller && <span>{category}</span>}
            </div>

            {/* Price — prominent */}
            <div className="mt-4 sm:mt-5">
              <p className="text-xs uppercase tracking-wider text-[#666666] dark:text-[#a3a3a3] mb-1">Price</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#FFBF00]">
                ₱{formatPrice(product.price)}
              </p>
            </div>

            <div className="border-t border-[#E0E0E0] dark:border-[#404040] my-5 sm:my-6" />

            {/* Overview / Description */}
            <section className="mb-5 sm:mb-6">
              <h3 className="text-xs uppercase tracking-wider text-[#666666] dark:text-[#a3a3a3] mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faBox} className="opacity-70" />
                Overview
              </h3>
              <p className="text-[#2C2C2C] dark:text-[#e5e5e5] text-sm sm:text-base leading-relaxed">
                {descExpanded ? desc : shortDesc}
              </p>
              {hasLongDesc && (
                <button
                  onClick={() => setDescExpanded((v) => !v)}
                  className="mt-2 text-sm font-medium text-[#FFBF00] hover:text-[#e6ac00] flex items-center gap-1"
                >
                  {descExpanded ? "Show less" : "Read more"}
                  <FontAwesomeIcon icon={descExpanded ? faChevronUp : faChevronDown} className="text-xs" />
                </button>
              )}
            </section>

            {/* Product ID (when available) */}
            {(product.product_id || product.productId) && (
              <section className="mb-5 sm:mb-6">
                <h3 className="text-xs uppercase tracking-wider text-[#666666] dark:text-[#a3a3a3] mb-2">Details</h3>
                <p className="text-sm">
                  <span className="text-[#666666] dark:text-[#a3a3a3]">Product ID </span>
                  <span className="font-mono text-[#2C2C2C] dark:text-[#e5e5e5]">
                    {product.product_id || product.productId}
                  </span>
                </p>
              </section>
            )}

            {/* Quantity + Stock */}
            <section className="mb-5 sm:mb-6">
              <h3 className="text-xs uppercase tracking-wider text-[#666666] dark:text-[#a3a3a3] mb-3">Quantity</h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center rounded-xl border-2 border-[#E0E0E0] dark:border-[#404040] overflow-hidden bg-white dark:bg-white/5">
                  <button
                    onClick={decreaseQuantity}
                    className="w-11 h-11 flex items-center justify-center text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-[#E0E0E0] dark:hover:bg-[#404040] transition-colors"
                    aria-label="Decrease"
                  >
                    <FontAwesomeIcon icon={faMinus} className="text-sm" />
                  </button>
                  <span className="w-14 text-center font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] text-lg">{quantity}</span>
                  <button
                    onClick={increaseQuantity}
                    className="w-11 h-11 flex items-center justify-center text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-[#E0E0E0] dark:hover:bg-[#404040] transition-colors"
                    aria-label="Increase"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#666666] dark:text-[#a3a3a3]">In stock</span>
                  <span className="text-[#E0E0E0] dark:text-[#404040]">·</span>
                  <span className="text-[#4CAF50] font-medium flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faTruck} className="text-xs" />
                    Ready to ship
                  </span>
                </div>
              </div>
            </section>

            {/* Price breakdown */}
            <div className="rounded-xl bg-white dark:bg-white/5 p-4 sm:p-5 mb-6 border border-[#E0E0E0] dark:border-[#404040]">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-[#666666] dark:text-[#a3a3a3]">
                  <FontAwesomeIcon icon={faTag} className="text-[#FFBF00]" />
                  ₱{formatPrice(product.price)} × {quantity}
                </span>
                <span className="font-bold text-[#2C2C2C] dark:text-[#e5e5e5] text-lg">
                  ₱{formatPrice(calculateTotalPrice())}
                </span>
              </div>
              <p className="text-xs text-[#666666] dark:text-[#a3a3a3] mt-1">Total</p>
            </div>

            {/* CTA */}
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || !username}
              className="w-full py-4 rounded-xl font-semibold text-base sm:text-lg bg-[#FFBF00] hover:bg-[#e6ac00] text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isAddingToCart ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="text-xl animate-spin" />
                  Adding…
                </>
              ) : !username ? (
                "Sign in to add to cart"
              ) : (
                <>
                  <FontAwesomeIcon icon={faShoppingCart} className="text-xl" />
                  Add {quantity} {quantity === 1 ? "item" : "items"} to cart
                </>
              )}
            </button>

            {/* Trust */}
            <p className="mt-4 text-center text-xs text-[#666666] dark:text-[#a3a3a3] flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faShieldHalved} className="text-[#4CAF50]" />
              Secure checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductModal.displayName = "ProductModal";

export default ProductModal;
