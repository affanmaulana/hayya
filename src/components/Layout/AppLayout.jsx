import React, { useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import BottomNav from './BottomNav.jsx';
import ChildSwitcher from './ChildSwitcher.jsx';
import OfflineBanner from './OfflineBanner.jsx';

/**
 * AppLayout — Main application shell.
 * 
 * Structure (top to bottom):
 * 1. Header bar (greeting + child switcher)
 * 2. Scrollable content area (<Outlet />)
 * 3. Offline banner (conditional)
 * 4. Bottom navigation (fixed)
 * 
 * Mobile-first: centered at max-w-[428px] on desktop per PRD 5.5.
 */
export default function AppLayout() {
  const { currentUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // Extract first name for greeting
  const firstName = currentUser?.fullName?.split(' ')[0] || 'Bunda';

  const isMainDashboard = [
    '/dashboard',
    '/dashboard/',
    '/dashboard/growth',
    '/dashboard/mpasi',
    '/dashboard/imunisasi'
  ].includes(location.pathname);

  // Deep sub-pages mapping
  const subPageTitles = {
    '/dashboard/profil/edit': 'Edit Profil',
    '/dashboard/profil/anak': 'Kelola Data Anak',
    '/dashboard/profil/edukasi': 'Edukasi & Artikel',
    '/dashboard/profil/cek-gejala': 'Cek Gejala',
  };

  const activeSubPageTitle = subPageTitles[location.pathname];

  return (
    <div className="relative min-h-dvh bg-bg flex justify-center">
      {/* Mobile container — centered with max-width for desktop */}
      <div className="w-full max-w-[428px] min-h-dvh flex flex-col bg-bg relative shadow-lg shadow-black/5">
        
        {/* ===== MAIN HEADER ===== */}
        {isMainDashboard && (
          <header className="sticky top-0 z-30 bg-white border-b border-border">
            <div className="flex items-center justify-between px-(--spacing-page) py-3">
              {/* Greeting */}
              <div className="flex flex-col">
                <span className="text-[13px] text-text-secondary font-[var(--font-body)]">
                  Halo, Bunda 🧡
                </span>
                <h1 className="text-lg font-bold text-text font-[var(--font-heading)] leading-tight m-0">
                  {firstName}
                </h1>
              </div>

              {/* Child Switcher */}
              <ChildSwitcher />
            </div>
          </header>
        )}

        {/* ===== SUB-PAGE ACTION BAR ===== */}
        {activeSubPageTitle && (
          <header className="sticky top-0 z-30 bg-white border-b border-border">
            <div className="flex items-center gap-3 px-(--spacing-page) py-3">
              <button
                onClick={() => navigate('/dashboard/profil')}
                className="p-1 -ml-1 rounded-full hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all duration-200 ease-in-out cursor-pointer focus:outline-none active:scale-95 flex items-center justify-center"
                aria-label="Kembali ke profil"
              >
                <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <h2 className="text-text font-semibold text-lg leading-tight m-0 font-[var(--font-heading)]">
                {activeSubPageTitle}
              </h2>
            </div>
          </header>
        )}

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 overflow-y-auto px-(--spacing-page) py-(--spacing-section) pb-28">
          <Outlet />
        </main>

        {/* ===== OFFLINE BANNER ===== */}
        <div className="fixed bottom-[104px] left-1/2 -translate-x-1/2 w-full max-w-[380px] z-30">
          <OfflineBanner />
        </div>

        {/* ===== BOTTOM NAVIGATION ===== */}
        <BottomNav />
      </div>
    </div>
  );
}
