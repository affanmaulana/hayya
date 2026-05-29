import React, { useState, useMemo } from 'react';
import useAuth from '../hooks/useAuth';
import { useChild } from '../hooks/useChild';
import { calculateAgeInMonthsAndDays, formatDate } from '../utils/dateHelpers';

export default function DashboardView() {
  const { currentUser } = useAuth();
  const { activeChild, childrenList, addChild } = useChild();

  // Local states for child form
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('L'); // Default: Laki-laki
  const [birthWeight, setBirthWeight] = useState('');
  const [birthHeight, setBirthHeight] = useState('');
  const [bloodType, setBloodType] = useState(''); // Optional
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current date string for max birth date input validation
  const todayString = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Determine greeting based on time of day
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 19) return 'Selamat sore';
    return 'Selamat malam';
  }, []);

  // Calculate age string for active child
  const ageString = useMemo(() => {
    if (!activeChild || !activeChild.dateOfBirth) return '';
    const { months, days } = calculateAgeInMonthsAndDays(activeChild.dateOfBirth);
    
    if (months === 0 && days === 0) return 'Baru lahir';
    
    const monthText = months > 0 ? `${months} Bulan` : '';
    const dayText = days > 0 ? `${days} Hari` : '';
    
    return [monthText, dayText].filter(Boolean).join(' ');
  }, [activeChild]);

  // Handle child registration submit
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
        bloodType: bloodType || '', // Make it optional as requested
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
    } catch (err) {
      setFormError(err.message || 'Gagal menambahkan profil si kecil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----- RENDER EMPTY STATE (No Children Registered) -----
  if (childrenList.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in px-1">
        {/* Empty State Banner */}
        <div className="flex flex-col items-center text-center space-y-4 pt-6">
          {/* Elegant minimalist SVG illustration of a baby crib / sleeping baby */}
          <div className="w-28 h-28 bg-primary/5 rounded-full flex items-center justify-center text-primary text-5xl shadow-sm">
            <svg
              className="w-16 h-16 text-primary/80"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m15-3.379a48.474 48.474 0 0 0-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 0 1 3 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 0 1 6 13.12M12.265 3.11a.375.375 0 1 1-.53.53.375.375 0 0 1 .53-.53Zm0 0 .53-.53"
              />
            </svg>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-[var(--font-heading)] text-text">
              {timeGreeting}, Bunda {currentUser?.fullName?.split(' ')[0]}! 🧡
            </h2>
            <p className="text-sm text-text-secondary max-w-[320px] leading-relaxed font-[var(--font-body)]">
              Yuk, daftarkan profil si kecil pertama Bunda untuk mulai memantau tumbuh kembang, jadwal imunisasi, dan nutrisi MPASI secara mandiri.
            </p>
          </div>
        </div>

        {/* Inline Registration Form */}
        <div className="bg-white rounded-(--radius-card) border border-border shadow-(--shadow-card) p-5 space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="text-base font-bold font-[var(--font-heading)] text-text">
              Tambah Profil Si Kecil
            </h3>
            <p className="text-xs text-text-secondary font-[var(--font-body)] mt-0.5">
              Masukkan data kelahiran si kecil dengan benar, ya Bunda.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-danger/5 border border-danger/10 text-danger text-xs rounded-xl font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddChildSubmit} className="space-y-4 font-[var(--font-body)]">
            {/* Child Name */}
            <div className="space-y-1.5">
              <label htmlFor="child-name" className="text-xs font-semibold text-text">
                Nama Panggilan <span className="text-primary">*</span>
              </label>
              <input
                id="child-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misal: Rayyan, Kiran, Arka"
                className="w-full h-11 px-4 border border-border rounded-(--radius-input) text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Birth Date */}
            <div className="space-y-1.5">
              <label htmlFor="birth-date" className="text-xs font-semibold text-text">
                Tanggal Lahir <span className="text-primary">*</span>
              </label>
              <input
                id="birth-date"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={todayString} // Restrict birthdate to past/today dates only
                className="w-full h-11 px-4 border border-border rounded-(--radius-input) text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Gender Switcher */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-text">
                Jenis Kelamin <span className="text-primary">*</span>
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setGender('L')}
                  className={`flex-1 h-11 rounded-(--radius-input) border text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    gender === 'L'
                      ? 'border-primary bg-primary/5 text-primary font-semibold'
                      : 'border-border bg-bg-card text-text-secondary hover:bg-bg'
                  }`}
                >
                  <span>👦</span> Laki-laki
                </button>
                <button
                  type="button"
                  onClick={() => setGender('P')}
                  className={`flex-1 h-11 rounded-(--radius-input) border text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    gender === 'P'
                      ? 'border-primary bg-primary/5 text-primary font-semibold'
                      : 'border-border bg-bg-card text-text-secondary hover:bg-bg'
                  }`}
                >
                  <span>👧</span> Perempuan
                </button>
              </div>
            </div>

            {/* Birth Weight & Height Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="weight" className="text-xs font-semibold text-text">
                  Berat Lahir (kg) <span className="text-primary">*</span>
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="15"
                  value={birthWeight}
                  onChange={(e) => setBirthWeight(e.target.value)}
                  placeholder="Contoh: 3.2"
                  className="w-full h-11 px-4 border border-border rounded-(--radius-input) text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="height" className="text-xs font-semibold text-text">
                  Tinggi Lahir (cm) <span className="text-primary">*</span>
                </label>
                <input
                  id="height"
                  type="number"
                  step="0.1"
                  min="10"
                  max="100"
                  value={birthHeight}
                  onChange={(e) => setBirthHeight(e.target.value)}
                  placeholder="Contoh: 49"
                  className="w-full h-11 px-4 border border-border rounded-(--radius-input) text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Blood Type Selection (Optional as requested) */}
            <div className="space-y-1.5">
              <label htmlFor="blood-type" className="text-xs font-semibold text-text">
                Golongan Darah <span className="text-text-muted text-[10px]">(Opsional)</span>
              </label>
              <select
                id="blood-type"
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full h-11 px-4 border border-border rounded-(--radius-input) text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors cursor-pointer"
              >
                <option value="">Pilih golongan darah...</option>
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
              className="w-full h-[52px] mt-2 rounded-(--radius-button) bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-primary/20"
            >
              {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Profil Si Kecil 🧡'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----- RENDER DASHBOARD (When at least one child is registered) -----
  return (
    <div className="space-y-6 animate-fade-in px-1">
      {/* Dynamic Welcome Banner */}
      <div className="bg-gradient-to-br from-primary to-secondary rounded-(--radius-card) p-5 text-white shadow-md shadow-primary/5 relative overflow-hidden">
        {/* Ambient background glow shapes */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        
        <div className="relative space-y-3">
          <div>
            <p className="text-[12px] opacity-85 font-medium tracking-wide uppercase font-[var(--font-body)]">
              {timeGreeting}, Bunda {currentUser?.fullName?.split(' ')[0]} 🌟
            </p>
            <h2 className="text-xl font-extrabold font-[var(--font-heading)] leading-tight text-white mt-0.5">
              Aktivitas Si Kecil Hari Ini
            </h2>
          </div>
          
          {activeChild && (
            <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-2xl animate-pulse">👶</span>
              <div className="flex flex-col">
                <span className="text-[11px] text-white/70 font-medium">Usia {activeChild.name} saat ini</span>
                <span className="text-sm font-bold tracking-tight">
                  {ageString || 'Kalkulasi usia...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Core Active Child Profile Card */}
      {activeChild ? (
        <div className="bg-white rounded-(--radius-card) border border-border shadow-(--shadow-card) p-5 space-y-5">
          <div className="flex items-center gap-4">
            {/* Elegant profile avatar placeholder */}
            <div className="w-14 h-14 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-2xl font-bold text-primary font-[var(--font-heading)]">
              {activeChild.name ? activeChild.name.charAt(0).toUpperCase() : 'S'}
            </div>
            
            <div className="flex-1">
              <h3 className="text-base font-extrabold font-[var(--font-heading)] text-text">
                {activeChild.name}
              </h3>
              <p className="text-xs text-text-secondary font-[var(--font-body)]">
                Lahir pada {formatDate(activeChild.dateOfBirth)}
              </p>
            </div>

            <span className="px-2.5 py-1 text-[11px] font-bold rounded-full font-[var(--font-body)] bg-accent/5 text-accent border border-accent/10">
              {activeChild.gender === 'L' ? 'Laki-laki 👦' : 'Perempuan 👧'}
            </span>
          </div>

          <hr className="border-border" />

          {/* Child Birth Parameters Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-bg rounded-xl p-3 border border-border/40">
              <p className="text-[10px] text-text-muted font-medium font-[var(--font-body)] uppercase">
                Berat Lahir
              </p>
              <p className="text-sm font-bold text-text font-[var(--font-heading)] mt-0.5">
                {activeChild.birthWeightKg} <span className="text-[11px] font-medium text-text-secondary">kg</span>
              </p>
            </div>
            <div className="bg-bg rounded-xl p-3 border border-border/40">
              <p className="text-[10px] text-text-muted font-medium font-[var(--font-body)] uppercase">
                Tinggi Lahir
              </p>
              <p className="text-sm font-bold text-text font-[var(--font-heading)] mt-0.5">
                {activeChild.birthHeightCm} <span className="text-[11px] font-medium text-text-secondary">cm</span>
              </p>
            </div>
            <div className="bg-bg rounded-xl p-3 border border-border/40">
              <p className="text-[10px] text-text-muted font-medium font-[var(--font-body)] uppercase">
                Gol. Darah
              </p>
              <p className="text-sm font-bold text-text font-[var(--font-heading)] mt-0.5">
                {activeChild.bloodType || '-'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-(--radius-card) border border-border shadow-(--shadow-card) p-6 text-center text-text-secondary text-sm">
          Menyiapkan data profil anak... 🧡
        </div>
      )}

      {/* Offline and Local Storage Security Assurance */}
      <div className="flex items-start gap-3 p-4 bg-accent/5 border border-accent/10 rounded-(--radius-card)">
        <span className="text-lg leading-none pt-0.5">🔒</span>
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-accent font-[var(--font-heading)]">
            Jaminan Keamanan Data Offline-First
          </h4>
          <p className="text-[11px] text-text-secondary leading-relaxed font-[var(--font-body)]">
            Seluruh data tubuh kembang, riwayat imunisasi, dan menu MPASI anak disimpan secara lokal di HP Bunda. Tidak ada data yang dikirim ke server luar.
          </p>
        </div>
      </div>
    </div>
  );
}
