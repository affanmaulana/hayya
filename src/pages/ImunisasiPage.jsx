import React from 'react';
import { useChildContext } from '../context/ChildContext.jsx';

/**
 * ImunisasiPage — Placeholder for immunization tracker.
 */
export default function ImunisasiPage() {
  const { activeChild } = useChildContext();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold font-[var(--font-heading)] text-text">
          Jadwal Imunisasi 🛡️
        </h2>
        <p className="text-sm text-text-secondary mt-1 font-[var(--font-body)]">
          Pantau vaksinasi {activeChild?.name || 'si kecil'} sesuai jadwal IDAI
        </p>
      </div>

      <div className="bg-bg-card rounded-(--radius-card) p-6 shadow-(--shadow-card) flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
          💉
        </div>
        <h3 className="text-base font-bold font-[var(--font-heading)] text-text">
          Segera Hadir
        </h3>
        <p className="text-sm text-text-secondary max-w-[250px]">
          Fitur pelacak imunisasi dengan pengingat jadwal vaksin akan segera tersedia, Bunda.
        </p>
      </div>
    </div>
  );
}
