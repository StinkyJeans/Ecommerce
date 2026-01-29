"use client";

export function StatCardSkeleton() {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100 animate-pulse">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-6 sm:h-8 bg-gray-200 rounded w-16 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-24" />
    </div>
  );
}

export function SellerCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 hover:shadow-lg transition-shadow flex flex-col animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
      <div className="h-24 sm:h-28 md:h-32 bg-gray-200 rounded-lg mb-4" />
      <div className="flex gap-2 mt-auto pt-2">
        <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
        <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SellerCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
