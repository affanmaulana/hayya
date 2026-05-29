import React from 'react';
import { useChildContext } from '../context/ChildContext.jsx';

/**
 * PerkembanganPage — Placeholder for Milestone & Growth tracking.
 */
export default function PerkembanganPage() {
  const { activeChild } = useChildContext();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-[var(--font-heading)] text-text">
          Tumbuh Kembang 📊
        </h2>
        <p className="text-sm text-text-secondary mt-1 font-[var(--font-body)]">
          Pantau milestone dan pertumbuhan {activeChild?.name || 'si kecil'}
        </p>
      </div>

      {/* Placeholder content */}
      <div className="bg-bg-card rounded-card p-6 shadow-card flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-3xl">
          🌱
        </div>
        <h3 className="text-base font-bold font-[var(--font-heading)] text-text">
          Segera Hadir
        </h3>
        <p className="text-sm text-text-secondary max-w-[250px]">
          Fitur pencatatan milestone dan grafik pertumbuhan akan segera tersedia, Bunda.
        </p>
      </div>
    </div>
  );
}
