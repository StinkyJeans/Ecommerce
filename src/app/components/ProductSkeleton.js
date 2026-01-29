"use client";

export default function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-sm border border-[#E0E0E0] dark:border-[#404040] overflow-hidden flex flex-col animate-pulse">
      {/* Image Skeleton */}
      <div className="relative h-48 sm:h-56 md:h-64 bg-[#E0E0E0] dark:bg-[#404040]" />
      
      {/* Content Skeleton */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="h-5 bg-[#E0E0E0] dark:bg-[#404040] rounded w-3/4" />
        <div className="h-4 bg-[#E0E0E0] dark:bg-[#404040] rounded w-1/2" />
        <div className="h-8 bg-[#E0E0E0] dark:bg-[#404040] rounded w-1/3" />
        <div className="h-10 bg-[#E0E0E0] dark:bg-[#404040] rounded w-full mt-4" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
