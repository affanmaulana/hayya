import React from 'react';

/**
 * TabSwitcher - A premium shared Segmented Control component.
 * Features a sliding fluid capsule transition background indicator.
 * 
 * Props:
 * - tabs: Array of { id: string, label: string }
 * - activeTab: string (the currently active tab ID)
 * - onChange: function (callback when a tab is clicked)
 * - className: string (optional extra classes)
 */
export default function TabSwitcher({ tabs, activeTab, onChange, className = '' }) {
  if (!tabs || tabs.length !== 2) {
    return null;
  }

  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <div className={`relative flex bg-gray-50 p-1 rounded-2xl mb-3 mx-0 select-none ${className}`}>
      {/* Sliding active background indicator */}
      <div
        className="absolute top-1 bottom-1 left-1 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-in-out"
        style={{
          width: 'calc(50% - 4px)',
          transform: activeIndex === 1 ? 'translateX(100%)' : 'translateX(0%)'
        }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`relative z-1 flex-1 py-2 text-xs font-bold rounded-xl transition-colors duration-300 cursor-pointer text-center focus:outline-none active:scale-98 ${
            activeTab === tab.id
              ? 'text-gray-900 font-extrabold'
              : 'text-gray-500 hover:text-gray-900 font-semibold'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
