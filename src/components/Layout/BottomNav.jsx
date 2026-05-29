import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * BottomNav — Fixed bottom navigation bar with 5 tabs.
 * PRD Bab 5.3: Ikon outlined (24dp) + label kecil, aktif = filled primary (#C2185B).
 * Touch targets: min 52px height for thumb-friendly interaction.
 */

const NAV_ITEMS = [
  {
    id: 'beranda',
    label: 'Beranda',
    path: '/dashboard',
    // Home icon
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        {active ? (
          <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 01-.53 1.28H18v7.44a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75V16.5h-3v4.75a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-7.44H3.31a.75.75 0 01-.53-1.28l8.69-8.69z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        )}
      </svg>
    ),
  },
  {
    id: 'growth',
    label: 'Tumbuh',
    path: '/dashboard/growth',
    // Chart/growth icon
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        {active ? (
          <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 3.75a7.5 7.5 0 0 1 6.75 6.75h-6.75V3.75Z" />
        )}
      </svg>
    ),
  },
  {
    id: 'mpasi',
    label: 'MPASI',
    path: '/dashboard/mpasi',
    // Bowl/food icon
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        {active ? (
          <>
            <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM8.547 4.505a8.25 8.25 0 1011.672 8.214l-.46-.46a2.252 2.252 0 01-.422-.586l-1.08-2.16a.414.414 0 00-.663-.107.827.827 0 01-.812.21l-1.273-.363a.89.89 0 00-.738.135l-.57.69a.187.187 0 01-.2.058l-.6-.168a.71.71 0 00-.728.188l-.349.349a1.882 1.882 0 01-2.461.162l-.003-.002a1.665 1.665 0 00-1.798-.146.71.71 0 01-.683-.014l-.477-.262a.3.3 0 01-.084-.442z" />
          </>
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53.53.375.375 0 0 1 .53-.53Zm0 0 .53-.53" />
        )}
      </svg>
    ),
  },
  {
    id: 'imunisasi',
    label: 'Imunisasi',
    path: '/dashboard/imunisasi',
    // Shield/vaccine icon
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        {active ? (
          <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        )}
      </svg>
    ),
  },
  {
    id: 'profil',
    label: 'Lainnya',
    path: '/dashboard/profil',
    // User/more icon
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        {active ? (
          <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        )}
      </svg>
    ),
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from current path
  const getActiveTab = () => {
    const path = location.pathname;
    // Exact match for dashboard home
    if (path === '/dashboard' || path === '/dashboard/') return 'beranda';
    // Match sub-routes
    const match = NAV_ITEMS.find(item => item.id !== 'beranda' && path.startsWith(item.path));
    return match ? match.id : 'beranda';
  };

  const activeTab = getActiveTab();

  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[428px] bg-white border-t border-border shadow-(--shadow-nav) z-40 safe-bottom"
      role="navigation"
      aria-label="Navigasi utama"
    >
      <div className="flex items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] transition-colors duration-200 cursor-pointer relative ${
                isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
              {item.icon(isActive)}
              <span className={`text-[10px] leading-tight font-[var(--font-body)] ${
                isActive ? 'font-semibold' : 'font-medium'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
