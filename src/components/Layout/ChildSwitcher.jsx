import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useChild } from '../../hooks/useChild.js';
import { calculateAgeInMonthsAndDays } from '../../utils/dateHelpers.js';

/**
 * ChildSwitcher — Dropdown to switch between registered children.
 * Shows active child name + age, tap to reveal selection list.
 * Includes a permanent "+ Tambah Anak" option with inline pop-up modal.
 */
export default function ChildSwitcher() {
  const { childrenList, activeChild, activeChildId, setActiveChildId, addChild } = useChild();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Local state for child registration modal
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('L');
  const [birthWeight, setBirthWeight] = useState('');
  const [birthHeight, setBirthHeight] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Limit date of birth to past or today
  const todayString = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Calculate age string from DOB using standard helper
  const getAgeLabel = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const { months, days } = calculateAgeInMonthsAndDays(dateOfBirth);
    if (months === 0 && days === 0) return 'Baru lahir';
    const monthText = months > 0 ? `${months} bln` : '';
    const dayText = days > 0 ? `${days} hari` : '';
    return [monthText, dayText].filter(Boolean).join(' ');
  };

  // Handle modal submit
  const handleAddChildSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (!name.trim()) {
        throw new Error('Nama panggilan si kecil tidak boleh kosong, Bunda. 🧡');
      }
      if (!dateOfBirth) {
        throw new Error('Tanggal lahir si kecil tidak boleh kosong, Bunda. 🧡');
      }
      if (!birthWeight || parseFloat(birthWeight) <= 0) {
        throw new Error('Berat lahir harus berupa angka positif, Bunda. 🧡');
      }
      if (!birthHeight || parseFloat(birthHeight) <= 0) {
        throw new Error('Tinggi lahir harus berupa angka positif, Bunda. 🧡');
      }

      const childData = {
        name: name.trim(),
        dateOfBirth,
        gender,
        birthWeightKg: parseFloat(birthWeight),
        birthHeightCm: parseFloat(birthHeight),
        bloodType: bloodType || '',
        photoUrl: ''
      };

      addChild(childData);
      
      // Clear form on success
      setName('');
      setDateOfBirth('');
      setGender('L');
      setBirthWeight('');
      setBirthHeight('');
      setBloodType('');
      setIsModalOpen(false);
      setIsOpen(false);
    } catch (err) {
      setFormError(err.message || 'Gagal menambahkan profil si kecil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (childrenList.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/5 border border-secondary/10">
        <span className="text-xs font-semibold text-secondary font-[var(--font-body)]">
          Belum ada data anak 👶
        </span>
      </div>
    );
  }

  return (
    <div className="relative font-[var(--font-body)]" ref={dropdownRef}>
      {/* Premium Trigger Button - Minimalist, subtle interactive element */}
      <button
        id="child-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg border border-border/80 hover:border-primary/20 hover:shadow-card transition-all duration-200 cursor-pointer min-h-[38px] focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Pilih anak aktif"
      >
        {/* Gender-responsive premium pastel circle */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border font-extrabold text-[11px] ${
          activeChild?.gender === 'L'
            ? 'bg-accent/10 border-accent/15 text-accent'
            : 'bg-primary/10 border-primary/15 text-primary'
        }`}>
          {activeChild?.name ? activeChild.name.charAt(0).toUpperCase() : '👶'}
        </div>

        {/* Name */}
        <div className="flex flex-col items-start leading-tight pr-0.5">
          <span className="text-xs font-bold text-text font-[var(--font-heading)] max-w-[80px] truncate">
            {activeChild?.name || 'Pilih Anak'}
          </span>
          {activeChild?.dateOfBirth && (
            <span className="text-[9px] text-text-secondary font-medium tracking-tight mt-0.5">
              {getAgeLabel(activeChild.dateOfBirth)}
            </span>
          )}
        </div>

        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-56 bg-white rounded-card shadow-card-hover border border-border/80 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          role="listbox"
          aria-label="Daftar anak"
        >
          <div className="px-3 py-2.5 border-b border-border/50 bg-bg/50">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-[var(--font-heading)]">
              Pilih Profil Anak
            </span>
          </div>

          {/* Children List */}
          <div className="max-h-48 overflow-y-auto divide-y divide-border/30">
            {childrenList.map((child) => {
              const isActive = child.id === activeChildId;
              return (
                <button
                  key={child.id}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveChildId(child.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors duration-150 cursor-pointer min-h-[44px] text-left focus:outline-none ${
                    isActive ? 'bg-primary/5' : 'hover:bg-bg/40'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border font-extrabold text-[11px] ${
                    child.gender === 'L'
                      ? 'bg-accent/10 border-accent/15 text-accent'
                      : 'bg-primary/10 border-primary/15 text-primary'
                  }`}>
                    {child.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  {/* Name + age */}
                  <div className="flex flex-col items-start leading-tight flex-1 min-w-0">
                    <span className={`text-xs font-[var(--font-heading)] truncate w-full ${
                      isActive ? 'font-bold text-primary' : 'font-semibold text-text'
                    }`}>
                      {child.name}
                    </span>
                    {child.dateOfBirth && (
                      <span className="text-[9px] text-text-secondary mt-0.5">
                        {getAgeLabel(child.dateOfBirth)}
                      </span>
                    )}
                  </div>

                  {/* Active checkmark */}
                  {isActive && (
                    <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* "+ Add Child" Button inside Dropdown */}
          <div className="border-t border-border/50 p-2 bg-bg/30">
            <button
              onClick={() => {
                setFormError('');
                setIsModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-dashed border-primary/30 text-primary text-xs font-bold hover:bg-primary/5 transition-all duration-200 cursor-pointer focus:outline-none min-h-[36px]"
            >
              <span>➕</span> Tambah Profil Anak
            </button>
          </div>
        </div>
      )}

      {/* Clean Modal for Adding Child */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-4 py-8 animate-fade-in">
          <div className="w-full max-w-[380px] bg-white rounded-card border border-border/80 shadow-2xl p-5 space-y-4 my-auto animate-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold font-[var(--font-heading)] text-text">
                  Daftarkan Si Kecil
                </h3>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Isi informasi anak baru untuk dipantau.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-bg hover:bg-border/60 transition-colors flex items-center justify-center text-text-secondary text-sm font-bold cursor-pointer focus:outline-none"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-danger/5 border border-danger/10 text-danger text-[11px] rounded-input font-medium animate-shake">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddChildSubmit} className="space-y-3.5 text-left font-[var(--font-body)]">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text">
                  Nama Panggilan <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Kiran, Arka"
                  className="w-full h-9 px-3 border border-border rounded-input text-xs bg-bg-card focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* DOB */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text">
                  Tanggal Lahir <span className="text-primary">*</span>
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={todayString}
                  className="w-full h-9 px-3 border border-border rounded-input text-xs bg-bg-card focus:border-primary focus:outline-none transition-colors cursor-pointer"
                  required
                />
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-text">Jenis Kelamin *</span>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setGender('L')}
                    className={`flex-1 h-9 rounded-input border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none ${
                      gender === 'L'
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-border bg-bg-card text-text-secondary'
                    }`}
                  >
                    👦 Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('P')}
                    className={`flex-1 h-9 rounded-input border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none ${
                      gender === 'P'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-bg-card text-text-secondary'
                    }`}
                  >
                    👧 Perempuan
                  </button>
                </div>
              </div>

              {/* Weight & Height */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-text">Berat Lahir (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={birthWeight}
                    onChange={(e) => setBirthWeight(e.target.value)}
                    placeholder="Misal: 3.0"
                    className="w-full h-9 px-3 border border-border rounded-input text-xs bg-bg-card focus:border-primary focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-text">Tinggi Lahir (cm) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    value={birthHeight}
                    onChange={(e) => setBirthHeight(e.target.value)}
                    placeholder="Misal: 48"
                    className="w-full h-9 px-3 border border-border rounded-input text-xs bg-bg-card focus:border-primary focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Blood Type (Optional) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text">
                  Golongan Darah <span className="text-text-muted text-[9px] font-normal">(Opsional)</span>
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full h-9 px-3 border border-border rounded-input text-xs bg-bg-card focus:border-primary focus:outline-none transition-colors cursor-pointer"
                >
                  <option value="">Pilih...</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 mt-3 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm focus:outline-none"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Profil Si Kecil 🧡'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
