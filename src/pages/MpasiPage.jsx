import React from 'react';
import { useChildContext } from '../context/ChildContext.jsx';

/**
 * MpasiPage — Placeholder for MPASI meal planner.
 */
export default function MpasiPage() {
  const { activeChild } = useChildContext();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-[var(--font-heading)] text-text">
          Menu MPASI 🥣
        </h2>
        <p className="text-sm text-text-secondary mt-1 font-[var(--font-body)]">
          Rencana makan sehat untuk {activeChild?.name || 'si kecil'}
        </p>
      </div>

      <div className="bg-bg-card rounded-card p-6 shadow-card flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-3xl">
          🍽️
        </div>
        <h3 className="text-base font-bold font-[var(--font-heading)] text-text">
          Segera Hadir
        </h3>
        <p className="text-sm text-text-secondary max-w-[250px]">
          Fitur perencana menu MPASI mingguan dan resep sehat akan segera tersedia, Bunda.
        </p>
      </div>
    </div>
  );
}
