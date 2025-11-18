import React from 'react';

export default function ExploreLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Search bar skeleton */}
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded-full w-32"></div>
        ))}
      </div>

      {/* Tenants grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-6 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="flex gap-2 mt-4">
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                <div className="h-6 bg-gray-200 rounded-full w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
