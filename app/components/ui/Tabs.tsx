"use client"


import React from 'react';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabClick: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabClick }) => {
  // Split tabs into two rows for better readability
  const half = Math.ceil(tabs.length / 2);
  const first = tabs.slice(0, half);
  const second = tabs.slice(half);

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs Row 1">
        {first.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabClick(tab)}
            className={`${activeTab === tab
                ? 'border-[color:var(--primary)] text-[color:var(--primary)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            {tab}
          </button>
        ))}
      </nav>
      {second.length > 0 && (
        <nav className="mt-2 -mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs Row 2">
          {second.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabClick(tab)}
              className={`${activeTab === tab
                  ? 'border-[color:var(--primary)] text-[color:var(--primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {tab}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};

export default Tabs;
