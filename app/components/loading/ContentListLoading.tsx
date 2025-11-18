import React from 'react';

/**
 * Generic content list loading skeleton
 * Used for pages that display lists of content items (sermons, podcasts, books, etc.)
 */
export default function ContentListLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex justify-between items-center animate-pulse">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-gray-200"></div>
            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="flex items-center justify-between pt-2">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
