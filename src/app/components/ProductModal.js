"use client";

import { memo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import ProductImage from "./ProductImage";
import { formatPrice } from "@/lib/formatPrice";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { productFunctions } from "@/lib/supabase/api";
import { Close, Plus, Minus, ShoppingBasket, Timer, Tag, Store, Truck, ShieldCheck, Package, ChevronDown, ChevronUp, ChatBubble, Star } from "griddy-icons";
import StartChatButton from "./chat/StartChatButton";
import { useChatModal } from "@/app/context/ChatModalContext";

const STAR_OPTIONS = [5, 4, 3, 2, 1];

const ProductModal = memo(({ product, onClose, onAddToCart, isAddingToCart = false, username, initialQuantity = 1 }) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showChatOption, setShowChatOption] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(null);
  const [formRating, setFormRating] = useState(0);
  const [formText, setFormText] = useState("");
  const [submitReviewLoading, setSubmitReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState({ type: "", text: "" });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editText, setEditText] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const { openChat } = useChatModal();
  const productId = product?.product_id || product?.productId;

  useEffect(() => {
    const handleCartUpdated = () => {
      if (!isAddingToCart) {
        setShowChatOption(true);
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, [isAddingToCart]);

  useEffect(() => {
    if (showChatOption) {
      const timer = setTimeout(() => setShowChatOption(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showChatOption]);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setReviewsLoading(true);
    productFunctions
      .getProductReviews(productId, ratingFilter != null ? { rating: ratingFilter } : {})
      .then((data) => {
        if (!cancelled && data?.success) {
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating ?? 0);
          setTotalCount(data.totalCount ?? 0);
        }
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => { cancelled = true; };
  }, [productId, ratingFilter]);

  const handleSubmitReview = useCallback(() => {
    if (!productId || !username || formRating < 1 || formRating > 5) return;
    setSubmitReviewLoading(true);
    setReviewMessage({ type: "", text: "" });
    productFunctions
      .submitProductReview(productId, { rating: formRating, review_text: formText || null })
      .then((data) => {
        if (data?.success) {
          setReviewMessage({ type: "success", text: "Review saved." });
          setFormRating(0);
          setFormText("");
          return productFunctions.getProductReviews(productId);
        }
        setReviewMessage({ type: "error", text: data?.message || "Failed to save review." });
      })
      .then((data) => {
        if (data?.success) {
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating ?? 0);
          setTotalCount(data.totalCount ?? 0);
        }
      })
      .catch((e) => setReviewMessage({ type: "error", text: e?.message || "Failed to save review." }))
      .finally(() => setSubmitReviewLoading(false));
  }, [productId, username, formRating, formText]);

  const handleStartEdit = useCallback((r) => {
    setEditingReviewId(r.id);
    setEditRating(r.rating);
    setEditText(r.review_text || "");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditText("");
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!productId || !username || editRating < 1 || editRating > 5) return;
    setEditSaving(true);
    productFunctions
      .submitProductReview(productId, { rating: editRating, review_text: editText || null })
      .then((data) => {
        if (data?.success) return productFunctions.getProductReviews(productId, ratingFilter != null ? { rating: ratingFilter } : {});
        throw new Error(data?.message || "Failed to update review.");
      })
      .then((data) => {
        if (data?.success) {
          setReviews(data.reviews || []);
          setAverageRating(data.averageRating ?? 0);
          setTotalCount(data.totalCount ?? 0);
          setEditingReviewId(null);
        }
      })
      .catch(() => setEditingReviewId(null))
      .finally(() => setEditSaving(false));
  }, [productId, username, editRating, editText, ratingFilter]);

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

  const handleMessageSeller = useCallback(() => {
    const seller = product?.sellerUsername || product?.seller_username;
    const productId = product?.product_id || product?.productId;
    if (seller) {
      openChat({
        seller,
        product: productId,
      });
      setShowChatOption(false);
    }
  }, [product, openChat]);

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
            <Close size={20} className="text-current" />
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
                <span className="flex items-center gap-1.5 flex-wrap">
                  <Store size={18} className="text-[#FFBF00]" />
                  Sold by <span className="font-medium text-[#2C2C2C] dark:text-[#e5e5e5]">{seller}</span>
                  <StartChatButton
                    sellerUsername={seller}
                    productId={product.product_id || product.productId}
                    className="ml-2 text-[#2F79F4] hover:underline text-sm"
                  />
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
                <Package size={18} className="opacity-70 text-current" />
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
                  {descExpanded ? <ChevronUp size={14} className="text-current" /> : <ChevronDown size={14} className="text-current" />}
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
                    <Minus size={16} className="text-current" />
                  </button>
                  <span className="w-14 text-center font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] text-lg">{quantity}</span>
                  <button
                    onClick={increaseQuantity}
                    className="w-11 h-11 flex items-center justify-center text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-[#E0E0E0] dark:hover:bg-[#404040] transition-colors"
                    aria-label="Increase"
                  >
                    <Plus size={16} className="text-current" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#666666] dark:text-[#a3a3a3]">In stock</span>
                  <span className="text-[#E0E0E0] dark:text-[#404040]">·</span>
                  <span className="text-[#4CAF50] font-medium flex items-center gap-1.5">
                    <Truck size={14} className="text-current" />
                    Ready to ship
                  </span>
                </div>
              </div>
            </section>

            {/* Price breakdown */}
            <div className="rounded-xl bg-white dark:bg-white/5 p-4 sm:p-5 mb-6 border border-[#E0E0E0] dark:border-[#404040]">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-[#666666] dark:text-[#a3a3a3]">
                  <Tag size={18} className="text-[#FFBF00]" />
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
                  <Timer size={24} className="animate-spin text-current" />
                  Adding…
                </>
              ) : !username ? (
                "Sign in to add to cart"
              ) : (
                <>
                  <ShoppingBasket size={24} className="text-current" />
                  Add {quantity} {quantity === 1 ? "item" : "items"} to cart
                </>
              )}
            </button>

            {/* Message Seller Option After Add to Cart */}
            {showChatOption && (product?.sellerUsername || product?.seller_username) && (
              <button
                onClick={handleMessageSeller}
                className="mt-3 w-full py-3 rounded-xl font-medium text-sm bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ChatBubble size={18} className="text-current" />
                Message Seller About This Product
              </button>
            )}

            {/* Trust */}
            <p className="mt-4 text-center text-xs text-[#666666] dark:text-[#a3a3a3] flex items-center justify-center gap-2">
              <ShieldCheck size={18} className="text-[#4CAF50]" />
              Secure checkout
            </p>

            {/* Reviews */}
            <section className="mt-6 pt-6 border-t border-[#E0E0E0] dark:border-[#404040]">
              <h3 className="text-sm font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-3">Reviews</h3>
              {/* Star rating aggregate + filter */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="flex items-center gap-1 text-[#2C2C2C] dark:text-[#e5e5e5]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      className={s <= Math.round(averageRating) ? "text-[#FFBF00] fill-[#FFBF00]" : "text-[#E0E0E0] dark:text-[#404040]"}
                    />
                  ))}
                </span>
                <span className="text-sm text-[#666666] dark:text-[#a3a3a3]">
                  {totalCount === 0 ? "No reviews yet" : `Based on ${totalCount} review${totalCount === 1 ? "" : "s"}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setRatingFilter(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${ratingFilter === null ? "bg-[#FFBF00] text-[#2C2C2C]" : "bg-[#E0E0E0] dark:bg-[#404040] text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-[#d0d0d0] dark:hover:bg-[#505050]"}`}
                >
                  All
                </button>
                {STAR_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRatingFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${ratingFilter === r ? "bg-[#FFBF00] text-[#2C2C2C]" : "bg-[#E0E0E0] dark:bg-[#404040] text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-[#d0d0d0] dark:hover:bg-[#505050]"}`}
                  >
                    {r} <Star size={14} className={ratingFilter === r ? "fill-current" : ""} />
                  </button>
                ))}
              </div>

              {/* Write a review — below star rating, above reviews list */}
              {username ? (
                <div className="mb-6">
                  <p className="text-xs font-medium text-[#666666] dark:text-[#a3a3a3] mb-2">Write a review</p>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormRating(s)}
                        className="p-1 rounded hover:bg-[#E0E0E0] dark:hover:bg-[#404040]"
                        aria-label={`${s} star${s === 1 ? "" : "s"}`}
                      >
                        <Star size={20} className={s <= formRating ? "text-[#FFBF00] fill-[#FFBF00]" : "text-[#E0E0E0] dark:text-[#404040]"} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="Your review (optional)"
                    maxLength={2000}
                    rows={3}
                    className="w-full rounded-lg border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-white/5 px-3 py-2 text-sm text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#a3a3a3] resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleSubmitReview}
                      disabled={submitReviewLoading || formRating < 1}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-[#FFBF00] hover:bg-[#e6ac00] text-[#2C2C2C] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitReviewLoading ? "Saving…" : "Submit review"}
                    </button>
                    {reviewMessage.text && (
                      <span className={`text-sm ${reviewMessage.type === "success" ? "text-[#4CAF50]" : "text-red-500"}`}>
                        {reviewMessage.text}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="mb-6 text-sm text-[#666666] dark:text-[#a3a3a3]">
                  <Link href="/login" className="text-[#FFBF00] hover:underline">
                    Sign in to leave a review
                  </Link>
                </p>
              )}

              {/* Reviews list — below Write a review / Submit button */}
              {reviewsLoading ? (
                <p className="text-sm text-[#666666] dark:text-[#a3a3a3] py-2">Loading reviews…</p>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-[#666666] dark:text-[#a3a3a3] py-2">
                  {ratingFilter != null ? `No reviews with ${ratingFilter} star${ratingFilter === 1 ? "" : "s"}.` : "No reviews yet."}
                </p>
              ) : (
                <ul className="space-y-3 max-h-48 overflow-y-auto">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-lg border border-[#E0E0E0] dark:border-[#404040] p-3 bg-white dark:bg-white/5">
                      {editingReviewId === r.id ? (
                        <div className="inline-edit">
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setEditRating(s)}
                                className="p-0.5 rounded hover:bg-[#E0E0E0] dark:hover:bg-[#404040]"
                                aria-label={`${s} star${s === 1 ? "" : "s"}`}
                              >
                                <Star size={18} className={s <= editRating ? "text-[#FFBF00] fill-[#FFBF00]" : "text-[#E0E0E0] dark:text-[#404040]"} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            placeholder="Your review (optional)"
                            maxLength={2000}
                            rows={2}
                            className="w-full rounded-lg border border-[#E0E0E0] dark:border-[#404040] bg-white dark:bg-white/5 px-3 py-2 text-sm text-[#2C2C2C] dark:text-[#e5e5e5] placeholder-[#a3a3a3] resize-none mb-2"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              disabled={editSaving}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#FFBF00] hover:bg-[#e6ac00] text-[#2C2C2C] disabled:opacity-50"
                            >
                              {editSaving ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={editSaving}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#E0E0E0] dark:bg-[#404040] text-[#2C2C2C] dark:text-[#e5e5e5] hover:bg-[#d0d0d0] dark:hover:bg-[#505050] disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-medium text-[#2C2C2C] dark:text-[#e5e5e5] text-sm">{r.username || "Customer"}</span>
                            <span className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={12} className={s <= r.rating ? "text-[#FFBF00] fill-[#FFBF00]" : "text-[#E0E0E0] dark:text-[#404040]"} />
                              ))}
                            </span>
                            <span className="text-xs text-[#666666] dark:text-[#a3a3a3]">{formatRelativeTime(r.created_at)}</span>
                            {username && r.username === username && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(r)}
                                className="ml-auto text-xs font-medium text-[#FFBF00] hover:underline"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          {r.review_text && <p className="text-sm text-[#2C2C2C] dark:text-[#e5e5e5]">{r.review_text}</p>}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductModal.displayName = "ProductModal";

export default ProductModal;
