"use client";

import { useState } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/supabase/storage";

/**
 * ProductImage component with loading skeleton
 * Shows a skeleton loader while the image is loading
 * Automatically handles Supabase Storage URLs (public and private)
 */
export default function ProductImage({ 
  src, 
  alt, 
  className = "", 
  sizes,
  priority = false,
  bucket = null, // Optional: specify bucket for private images (e.g., 'seller-ids', 'user-avatars')
  ...props 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Get the processed image URL (handles private buckets)
  const imageSrc = src ? getImageUrl(src, bucket) : null;

  return (
    <>
      {/* Skeleton loader */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 overflow-hidden z-10">
          <div className="absolute inset-0 animate-shimmer"></div>
        </div>
      )}
      
      {/* Actual image */}
      {imageSrc && (
        <Image
          src={hasError ? "/placeholder-image.jpg" : imageSrc}
          alt={alt}
          fill
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          {...props}
        />
      )}
    </>
  );
}
