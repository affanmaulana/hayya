import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * BottomNav — Floating Pill · Premium iOS-inspired Liquid Glass.
 *
 * Wrapper : h-14, p-1 (4px all sides) — absolute minimum padding.
 * Items   : flex-1 h-full → each of the 5 tabs fills the inner height fully.
 * Active  : py-1.5 px-3 bg-black/5 rounded-full — compact pill highlight.
 * Icons   : w-5 h-5, monochrome inline SVG, strokeWidth 1.5 (inactive) / filled (active).
 * MPASI   : Apple icon — clean single-glyph food icon, same style as all others.
 * Glass   : bg-white/70 backdrop-blur-md border-white/50.
 */

/* ── Icon helpers ─────────────────────────────────────────────────────────── */

const HomeIcon = ({ active }) => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
    {active ? (
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 01-.53 1.28H18v7.44a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75V16.5h-3v4.75a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75v-7.44H3.31a.75.75 0 01-.53-1.28l8.69-8.69z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    )}
  </svg>
);

const GrowthIcon = ({ active }) => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
    {active ? (
      <path d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0zM12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6zM13.5 3.75a7.5 7.5 0 016.75 6.75h-6.75V3.75z" />
    )}
  </svg>
);

/**
 * AppleIcon — clean monochrome apple silhouette.
 * Outline: single continuous stroke path with leaf + body.
 * Filled : compact solid fill for active state.
 * strokeWidth matches all other icons (1.5 inactive).
 */
const AppleIcon = ({ active }) => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
    {active ? (
      <>
        {/* Stem */}
        <path d="M12 4.5C12 3 13 2 14.5 2a.5.5 0 010 1C13.5 3 13 3.75 13 4.5a.5.5 0 01-1 0z" strokeWidth="0" />
        {/* Apple body — filled */}
        <path d="M8.5 6C5.5 6 3 8.75 3 12.5 3 17.5 6.5 22 9.5 22c1 0 1.75-.5 2.5-.5s1.5.5 2.5.5c3 0 6.5-4.5 6.5-9.5C21 8.75 18.5 6 15.5 6c-1.25 0-2.25.5-3.5.5S9.75 6 8.5 6z" />
      </>
    ) : (
      <>
        {/* Stem */}
        <path d="M12 5c0-1.5 1-2.5 2.5-3" />
        {/* Apple body */}
        <path d="M8.5 7C5.5 7 3 9.5 3 13c0 5 3.5 9 6.5 9 1 0 1.75-.5 2.5-.5S13.25 22 14 22c3 0 6.5-4 6.5-9 0-3.5-2.5-6-5.5-6-1.25 0-2.25.5-3 .5S9.75 7 8.5 7z" />
      </>
    )}
  </svg>
);

const ShieldIcon = ({ active }) => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
    {active ? (
      <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    )}
  </svg>
);

const UserIcon = ({ active }) => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
    {active ? (
      <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    )}
  </svg>
);

/* ── Nav item definitions ─────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { id: 'beranda',   label: 'Beranda',   path: '/dashboard',           Icon: HomeIcon   },
  { id: 'growth',    label: 'Tumbuh',    path: '/dashboard/growth',    Icon: GrowthIcon },
  { id: 'mpasi',     label: 'MPASI',     path: '/dashboard/mpasi',     Icon: AppleIcon  },
  { id: 'imunisasi', label: 'Imunisasi', path: '/dashboard/imunisasi', Icon: ShieldIcon },
  { id: 'profil',    label: 'Lainnya',   path: '/dashboard/profil',    Icon: UserIcon   },
];

/* ── Component ────────────────────────────────────────────────────────────── */

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/dashboard/') return 'beranda';
    const match = NAV_ITEMS.find(item => item.id !== 'beranda' && path.startsWith(item.path));
    return match ? match.id : 'beranda';
  };

  const activeTab = getActiveTab();
  const activeIndex = NAV_ITEMS.findIndex(item => item.id === activeTab);

  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[400px] h-14 rounded-full z-50 bg-white/70 backdrop-blur-md border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
      role="navigation"
      aria-label="Navigasi utama"
    >
      {/* Inner wrapper — relative context for the sliding pill */}
      <div className="relative flex flex-row w-full h-full p-1">

        {/* Sliding pill — single element that glides between tabs */}
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 rounded-full bg-black/5 pointer-events-none"
          style={{
            width: `calc(100% / ${NAV_ITEMS.length})`,
            left: 0,
            transform: `translateX(calc(${activeIndex} * 100%))`,
            transition: 'transform 320ms cubic-bezier(0.34, 1.1, 0.64, 1)',
          }}
        />

        {/* Tab buttons — on top of pill, no individual bg */}
        {NAV_ITEMS.map(({ id, label, path, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`nav-${id}`}
              onClick={() => navigate(path)}
              className={`relative flex-1 basis-0 flex flex-col items-center justify-center gap-0.5 h-full rounded-full cursor-pointer select-none transition-colors duration-200 ${
                isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600 active:scale-95'
              }`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon active={isActive} />
              <span className="text-[9.5px] leading-none font-medium tracking-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
