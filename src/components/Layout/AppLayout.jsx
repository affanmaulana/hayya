import React, { useContext } from 'react';
import { Outlet } from 'react-router-dom';
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

  // Extract first name for greeting
  const firstName = currentUser?.fullName?.split(' ')[0] || 'Bunda';

  return (
    <div className="relative min-h-dvh bg-bg flex justify-center">
      {/* Mobile container — centered with max-width for desktop */}
      <div className="w-full max-w-[428px] min-h-dvh flex flex-col bg-bg relative shadow-lg shadow-black/5">
        
        {/* ===== HEADER ===== */}
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
