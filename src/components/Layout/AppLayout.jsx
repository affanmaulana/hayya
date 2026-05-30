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
      <div className="w-full min-h-screen mx-auto bg-white md:max-w-[768px] lg:max-w-[1024px] shadow-sm relative flex flex-col">
        
        {/* ===== MAIN HEADER ===== */}
        {isMainDashboard && (
          <header className="sticky top-0 z-40 w-full">
            {/* Progressive Glass Blur background layer */}
            <div 
              className="absolute inset-0 bg-white/20 pointer-events-none -z-10"
              style={{ 
                backdropFilter: 'blur(8px)', 
                WebkitBackdropFilter: 'blur(8px)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 80%, transparent 100%)', 
                maskImage: 'linear-gradient(to bottom, black 0%, black 80%, transparent 100%)' 
              }}
            />
            <div className="flex items-center justify-between px-4 py-4">
              {/* Greeting */}
              <div className="flex flex-col justify-center">
                <span className="text-xs text-gray-400 font-medium font-[var(--font-body)]">
                  Halo, Bunda 🧡
                </span>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight font-[var(--font-heading)] leading-tight m-0">
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
          <header className="sticky top-0 z-40 w-full bg-white/20">
            {/* Progressive Glass Blur background layer */}
            <div 
              className="absolute inset-0 pointer-events-none -z-10"
              style={{ 
                backdropFilter: 'blur(8px)', 
                WebkitBackdropFilter: 'blur(8px)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 80%, transparent 100%)', 
                maskImage: 'linear-gradient(to bottom, black 0%, black 80%, transparent 100%)' 
              }}
            />
            <div className="px-4 h-16 flex items-center justify-between relative">
              <button
                onClick={() => navigate('/dashboard/profil')}
                className="w-10 h-10 rounded-full bg-white/80 border border-white/60 shadow-sm flex items-center justify-center text-gray-800 hover:bg-black/[0.02] active:scale-95 transition-all cursor-pointer focus:outline-none"
                aria-label="Kembali ke profil"
              >
                <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              
              <h2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-900 font-semibold text-sm tracking-tight bg-white/40 border border-white/20 px-3 py-1 rounded-full whitespace-nowrap">
                {activeSubPageTitle}
              </h2>
              
              {/* Invisible spacer to maintain symmetry for justify-between alignment */}
              <div className="w-10 h-10 pointer-events-none" />
            </div>
          </header>
        )}

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 overflow-y-auto px-(--spacing-page) pt-0 pb-(--spacing-section) pb-28">
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
