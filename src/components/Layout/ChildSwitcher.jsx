import React, { useState, useRef, useEffect } from 'react';
import { useChildContext } from '../../context/ChildContext.jsx';

/**
 * ChildSwitcher — Dropdown to switch between registered children.
 * Shows active child name + age, tap to reveal selection list.
 */
export default function ChildSwitcher() {
  const { childrenList, activeChild, activeChildId, setActiveChildId } = useChildContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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

  // Calculate age string from DOB
  const getAgeLabel = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const now = new Date();
    const dob = new Date(dateOfBirth);
    let months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    if (now.getDate() < dob.getDate()) months--;
    if (months < 0) months = 0;
    if (months < 1) {
      const days = Math.floor((now - dob) / (1000 * 60 * 60 * 24));
      return `${days} hari`;
    }
    if (months < 24) return `${months} bulan`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years} thn ${rem} bln` : `${years} tahun`;
  };

  if (childrenList.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-(--radius-card) bg-secondary/10">
        <span className="text-sm text-text-secondary font-[var(--font-body)]">
          Belum ada data anak 👶
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="child-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-(--radius-card) bg-white border border-border hover:shadow-(--shadow-card-hover) transition-all duration-200 cursor-pointer min-h-[44px]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Pilih anak aktif"
      >
        {/* Child avatar circle */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold font-[var(--font-heading)]">
            {activeChild?.name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>

        {/* Name + age */}
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold text-text font-[var(--font-heading)] truncate max-w-[120px]">
            {activeChild?.name || 'Pilih Anak'}
          </span>
          {activeChild?.dateOfBirth && (
            <span className="text-[11px] text-text-secondary">
              {getAgeLabel(activeChild.dateOfBirth)}
            </span>
          )}
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-56 bg-white rounded-(--radius-card) shadow-(--shadow-card-hover) border border-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          role="listbox"
          aria-label="Daftar anak"
        >
          <div className="px-3 py-2 border-b border-border">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider font-[var(--font-heading)]">
              Pilih Anak
            </span>
          </div>
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
                className={`w-full flex items-center gap-3 px-3 py-3 transition-colors duration-150 cursor-pointer min-h-[48px] ${
                  isActive
                    ? 'bg-primary/5 border-l-3 border-l-primary'
                    : 'hover:bg-bg border-l-3 border-l-transparent'
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-br from-secondary to-primary'
                    : 'bg-border'
                }`}>
                  <span className={`text-xs font-bold font-[var(--font-heading)] ${
                    isActive ? 'text-white' : 'text-text-secondary'
                  }`}>
                    {child.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>

                {/* Name + age */}
                <div className="flex flex-col items-start leading-tight">
                  <span className={`text-sm font-[var(--font-heading)] ${
                    isActive ? 'font-bold text-primary' : 'font-semibold text-text'
                  }`}>
                    {child.name}
                  </span>
                  {child.dateOfBirth && (
                    <span className="text-[11px] text-text-secondary">
                      {getAgeLabel(child.dateOfBirth)}
                    </span>
                  )}
                </div>

                {/* Active indicator */}
                {isActive && (
                  <svg className="w-4 h-4 text-primary ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
