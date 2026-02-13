"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faHeart, faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import ProductImage from "../ProductImage";
import { formatPrice } from "@/lib/formatPrice";

export default function CategoryProductCard({ product, onView }) {
  const name = product.productName || product.product_name;
  const idUrl = product.idUrl || product.id_url;

  return (
    <div className="group bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-[#E0E0E0] dark:border-[#404040] relative">
      <div className="absolute top-3 left-3 z-10">
        {product.stock_quantity > 0 && product.is_available && (
          <span className="px-2 py-1 bg-[#FFBF00] text-white text-xs font-bold rounded">NEW</span>
        )}
      </div>
      <div className="absolute top-3 right-3 z-10">
        <button
          type="button"
          className="w-8 h-8 bg-white dark:bg-[#404040] rounded-full flex items-center justify-center shadow-md hover:bg-[#E0E0E0] dark:hover:bg-[#505050] transition-colors opacity-0 group-hover:opacity-100 border border-[#E0E0E0] dark:border-[#404040]"
        >
          <FontAwesomeIcon icon={faHeart} className="text-[#FFBF00] text-sm" />
        </button>
      </div>

      <div className="relative h-64 overflow-hidden bg-white dark:bg-white/5">
        <ProductImage
          src={idUrl}
          alt={name}
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onView(product)}
            className="bg-white dark:bg-[#404040] rounded-full p-3 shadow-lg hover:scale-110 transition-transform"
          >
            <FontAwesomeIcon icon={faEye} className="text-[#FFBF00] text-lg" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <p className="text-xs font-bold text-[#666666] dark:text-[#a3a3a3] uppercase mb-1">ACCESSORIES</p>
        <h3 className="font-bold text-[#2C2C2C] dark:text-[#e5e5e5] mb-2 line-clamp-1 group-hover:text-[#FFBF00] transition-colors">
          {name}
        </h3>
        <p className="text-lg font-bold text-[#FFBF00] mb-4">₱{formatPrice(product.price)}</p>
        <button
          type="button"
          onClick={() => onView(product)}
          className="w-full bg-[#FFBF00] hover:bg-[#e6ac00] text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faShoppingCart} className="text-sm" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}
