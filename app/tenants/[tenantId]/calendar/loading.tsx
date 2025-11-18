import React from 'react';

export default function CalendarLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex justify-between items-center animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Calendar grid skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-7 gap-4 mb-4 animate-pulse">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center">
              <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-4 animate-pulse">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <div className="h-6 bg-gray-200 rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming events skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
