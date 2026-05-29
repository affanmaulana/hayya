import React from 'react';
import useOnlineStatus from '../../hooks/useOnlineStatus.js';

/**
 * OfflineBanner — Displays a reassuring message when the device is offline.
 * Positioned above the bottom nav. Hidden when online.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-banner"
      className="flex items-center justify-center gap-2 px-4 py-2 bg-warning/10 border-t border-warning/20"
      role="status"
      aria-live="polite"
    >
      <svg className="w-4 h-4 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M15.536 8.464a5 5 0 010 7.072M8.464 15.536a5 5 0 010-7.072" />
      </svg>
      <span className="text-xs text-text-secondary font-medium font-[var(--font-body)]">
        Mode offline — data disimpan aman di HP Bunda 📱
      </span>
    </div>
  );
}
