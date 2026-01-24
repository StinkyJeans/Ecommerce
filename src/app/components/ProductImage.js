"use client";
import { useState } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/supabase/storage";
export default function ProductImage({ 
  src, 
  alt, 
  className = "", 
  sizes,
  priority = false,
  bucket = null, 
  ...props 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageSrc = src ? getImageUrl(src, bucket) : null;
  const isEdgeStoreUrl = src && (src.includes('edgestore.dev') || src.includes('files.edgestore.dev'));
  const finalSrc = isEdgeStoreUrl ? '/placeholder-image.jpg' : (hasError ? "/placeholder-image.jpg" : imageSrc);
  return (
    <>
      {}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 overflow-hidden z-10">
          <div className="absolute inset-0 animate-shimmer"></div>
        </div>
      )}
      {}
      {finalSrc && (
        <Image
          src={finalSrc}
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