"use client";

import { useState, useEffect } from "react";
import { Package, Tag } from "griddy-icons";
import { formatPrice } from "@/lib/formatPrice";
import { createClient } from "@/lib/supabase/client";

export default function ProductInfoCard({ productId }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        if (!supabase) return;

        const { data, error } = await supabase
          .from("products")
          .select("product_id, product_name, price, id_url, description")
          .eq("product_id", productId)
          .single();

        if (!cancelled) {
          if (!error && data) {
            setProduct(data);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!productId || loading || !product) return null;

  return (
    <div className="mx-4 mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
          <Package size={20} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Tag size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
              Product Inquiry
            </span>
          </div>
          <h4 className="font-semibold text-[#2C2C2C] dark:text-[#e5e5e5] text-sm mb-1 line-clamp-1">
            {product.product_name || product.product_id}
          </h4>
          <p className="text-xs text-[#666666] dark:text-[#a3a3a3] line-clamp-2 mb-2">
            {product.description || "Product details"}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#666666] dark:text-[#a3a3a3]">Price:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              ₱{formatPrice(product.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
