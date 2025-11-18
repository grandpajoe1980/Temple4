import React from 'react';

export default function PostsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex justify-between items-center animate-pulse">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Posts skeleton */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="ml-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
