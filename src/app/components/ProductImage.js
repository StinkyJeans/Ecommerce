"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/supabase/storage";

export default function ProductImage({ 
  src, 
  alt, 
  className = "", 
  sizes,
  priority = false,
  bucket = null,
  onLoad,
  onError,
  ...props 
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    if (src) {
      const url = getImageUrl(src, bucket);
      setImageSrc(url);
    } else {
      setImageSrc('/placeholder-image.jpg');
      setIsLoading(false);
    }
  }, [src, bucket]);

  const isEdgeStoreUrl = src && (src.includes('edgestore.dev') || src.includes('files.edgestore.dev'));
  const finalSrc = isEdgeStoreUrl ? '/placeholder-image.jpg' : (hasError ? "/placeholder-image.jpg" : imageSrc);

  const handleLoad = (e) => {
    setIsLoading(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(e);
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 overflow-hidden z-10">
          <div className="absolute inset-0 animate-shimmer"></div>
        </div>
      )}
      {finalSrc && (
        <Image
          src={finalSrc}
          alt={alt || "Product image"}
          fill
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
          loading={priority ? "eager" : "lazy"}
          quality={85}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
}