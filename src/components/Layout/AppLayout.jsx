import React, { useContext } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useChildContext } from '../../context/ChildContext.jsx';
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
  const { activeChild } = useChildContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract first name for greeting
  const firstName = currentUser?.fullName?.split(' ')[0] || 'Bunda';

  // Dynamic header configuration based on path
  const getHeaderConfig = () => {
    const path = location.pathname.replace(/\/$/, '');
    
    // 1. Home / Beranda
    if (path === '/dashboard' || path === '' || path === '/' || path === '/beranda') {
      return {
        show: true,
        showBackButton: false,
        title: firstName,
        subtitle: 'Halo, Bunda 🧡',
        showSwitcher: true
      };
    }
    
    // 2. Main sections with ChildSwitcher
    if (path === '/dashboard/growth' || path === '/tumbuh') {
      return {
        show: true,
        showBackButton: false,
        title: 'Catatan Pertumbuhan',
        showSwitcher: true
      };
    }
    if (path === '/dashboard/mpasi' || path === '/mpasi') {
      return {
        show: true,
        showBackButton: false,
        title: 'MPASI',
        showSwitcher: true
      };
    }
    if (path === '/dashboard/imunisasi' || path === '/imunisasi') {
      return {
        show: true,
        showBackButton: false,
        title: 'Imunisasi',
        showSwitcher: true
      };
    }

    // 3. Lainnya (Profil) - Left side title, no switcher, no back button
    if (path === '/dashboard/profil' || path === '/profil') {
      return {
        show: true,
        showBackButton: false,
        title: 'Lainnya',
        showSwitcher: false
      };
    }

    // 4. Deep Sub-pages (with Back Button, Left side title, no switcher)
    const subPageTitles = {
      '/dashboard/profil/edit': 'Edit Profil',
      '/dashboard/profil/anak': 'Kelola Data Anak',
      '/dashboard/profil/edukasi': 'Edukasi & Artikel',
      '/dashboard/profil/cek-gejala': 'Cek Gejala',
    };

    if (subPageTitles[path]) {
      return {
        show: true,
        showBackButton: true,
        title: subPageTitles[path],
        showSwitcher: false
      };
    }

    // Default or other routes (e.g. /tambah-catatan, /pengaturan, etc.)
    // Note: /dashboard/growth/tambah is handled natively in TambahCatatanTumbuh.jsx, so we return show: false
    if (path === '/dashboard/growth/tambah') {
      return {
        show: false
      };
    }

    // Generic fallback for any other routes
    return {
      show: true,
      showBackButton: true,
      title: path.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      showSwitcher: false
    };
  };

  const headerConfig = getHeaderConfig();

  return (
    <div className="relative min-h-dvh bg-bg flex justify-center">
      {/* Mobile container — centered with max-width for desktop */}
      <div className="w-full min-h-screen mx-auto bg-white md:max-w-[768px] lg:max-w-[1024px] shadow-sm relative flex flex-col">
        
        {/* ===== DYNAMIC MAIN HEADER ===== */}
        {headerConfig.show && (
          <header className="sticky top-0 z-30 w-full">
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
            <div className="flex items-center justify-between px-4 py-4 min-h-[72px]">
              {/* Left Side: Title and Back Button */}
              <div className="flex items-center gap-3">
                {headerConfig.showBackButton && (
                  <button
                    onClick={() => {
                      if (location.pathname === '/dashboard/growth/tambah') {
                        window.dispatchEvent(new CustomEvent('animate-out-tambah'));
                      } else {
                        navigate('/dashboard/profil');
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-white/80 border border-white/60 shadow-sm flex items-center justify-center text-gray-800 hover:bg-black/[0.02] active:scale-95 transition-all cursor-pointer focus:outline-none shrink-0"
                    aria-label="Kembali"
                  >
                    <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                  </button>
                )}
                
                <div className="flex flex-col justify-center">
                  {headerConfig.subtitle && (
                    <span className="text-xs text-gray-400 font-medium font-[var(--font-body)]">
                      {headerConfig.subtitle}
                    </span>
                  )}
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight font-[var(--font-heading)] leading-tight m-0">
                    {headerConfig.title}
                  </h1>
                </div>
              </div>

              {/* Right Side: Child Switcher */}
              {headerConfig.showSwitcher && (
                <ChildSwitcher />
              )}
            </div>
          </header>
        )}

        {/* ===== MAIN CONTENT ===== */}
        <main className={`flex-1 overflow-y-auto px-(--spacing-page) pt-0 pb-(--spacing-section) ${location.pathname === '/dashboard/growth/tambah' ? 'pb-8' : 'pb-28'}`}>
          <Outlet />
        </main>

        {/* ===== OFFLINE BANNER ===== */}
        <div className="fixed bottom-[104px] left-1/2 -translate-x-1/2 w-full max-w-[380px] z-30">
          <OfflineBanner />
        </div>

        {/* ===== BOTTOM NAVIGATION ===== */}
        {location.pathname !== '/dashboard/growth/tambah' && <BottomNav />}
      </div>
    </div>
  );
}
