import React from 'react';

export default function ChatLoading() {
  return (
    <div className="h-[calc(100vh-200px)] flex">
      {/* Conversations list skeleton */}
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-xs space-y-2 animate-pulse">
                <div className={`h-16 bg-gray-200 rounded-lg w-64`}></div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 animate-pulse">
          <div className="h-10 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
