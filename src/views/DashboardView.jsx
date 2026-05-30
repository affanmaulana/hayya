import React, { useState, useMemo } from 'react';
import useAuth from '../hooks/useAuth';
import { useChild } from '../hooks/useChild';
import { calculateAgeInMonthsAndDays, formatDate } from '../utils/dateHelpers';

export default function DashboardView() {
  const { currentUser } = useAuth();
  const { activeChild, childrenList, addChild, isLoading } = useChild();

  // Local states for child form
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('L'); // Default: Laki-laki (L)
  const [birthWeight, setBirthWeight] = useState('');
  const [birthHeight, setBirthHeight] = useState('');
  const [bloodType, setBloodType] = useState(''); // Optional
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current date string for birth date max input validation
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

  // Calculate age string for active child using precise helper
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
    } catch (err) {
      setFormError(err.message || 'Gagal menambahkan profil si kecil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----- RENDER LOADING STATE -----
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 space-y-4 font-[var(--font-body)]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-text-secondary font-medium">Memuat data si kecil...</p>
      </div>
    );
  }

  // ----- RENDER EMPTY STATE (No Children Registered) -----
  if (childrenList.length === 0) {
    return (
    <div className="space-y-8 animate-fade-in px-0 font-[var(--font-body)]">
        {/* Empty State Banner with generous whitespace */}
        <div className="flex flex-col items-center text-center space-y-5 pt-4">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center text-primary shadow-sm border border-primary/10">
            <svg
              className="w-12 h-12 text-primary/80"
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
          
          <div className="space-y-2.5">
            <h2 className="text-xl font-bold font-[var(--font-heading)] text-text tracking-tight">
              {timeGreeting}, Bunda {currentUser?.fullName?.split(' ')[0]}! 🧡
            </h2>
            <p className="text-sm text-text-secondary max-w-[310px] leading-relaxed">
              Yuk, daftarkan profil si kecil pertama Bunda untuk mulai memantau tumbuh kembang, jadwal imunisasi, dan nutrisi MPASI secara mandiri.
            </p>
          </div>
        </div>

        {/* Premium Integrated Registration Form Card */}
        <div className="bg-white rounded-card border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-6 space-y-6 hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold font-[var(--font-heading)] text-gray-900 tracking-tight">
              Daftarkan Profil Si Kecil
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Masukkan informasi dasar kelahiran si kecil secara lengkap.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-danger/5 border border-danger/10 text-danger text-xs rounded-input font-medium animate-shake">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddChildSubmit} className="space-y-4">
            {/* Child Name */}
            <div className="space-y-1.5">
              <label htmlFor="child-name" className="text-xs font-semibold text-gray-700">
                Nama Panggilan <span className="text-primary">*</span>
              </label>
              <input
                id="child-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Misal: Rayyan, Kiran"
                className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
                required
              />
            </div>

            {/* Birth Date */}
            <div className="space-y-1.5">
              <label htmlFor="birth-date" className="text-xs font-semibold text-gray-700">
                Tanggal Lahir <span className="text-primary">*</span>
              </label>
              <input
                id="birth-date"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={todayString}
                className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out cursor-pointer"
                required
              />
            </div>

            {/* Gender Selection */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-gray-700">
                Jenis Kelamin <span className="text-primary">*</span>
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setGender('L')}
                  className={`flex-1 h-11 rounded-input border text-sm font-semibold transition-all duration-200 ease-in-out flex items-center justify-center gap-2 cursor-pointer focus:outline-none ${
                    gender === 'L'
                      ? 'border-accent bg-accent/5 text-accent'
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50/50 hover:border-gray-300'
                  }`}
                >
                  👦 Laki-laki
                </button>
                <button
                  type="button"
                  onClick={() => setGender('P')}
                  className={`flex-1 h-11 rounded-input border text-sm font-semibold transition-all duration-200 ease-in-out flex items-center justify-center gap-2 cursor-pointer focus:outline-none ${
                    gender === 'P'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50/50 hover:border-gray-300'
                  }`}
                >
                  👧 Perempuan
                </button>
              </div>
            </div>

            {/* Birth Weight & Height Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label htmlFor="weight" className="text-xs font-semibold text-gray-700">
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
                  placeholder="Misal: 3.2"
                  className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="height" className="text-xs font-semibold text-gray-700">
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
                  placeholder="Misal: 49"
                  className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
                  required
                />
              </div>
            </div>

            {/* Blood Type (Optional) */}
            <div className="space-y-1.5">
              <label htmlFor="blood-type" className="text-xs font-semibold text-gray-700">
                Golongan Darah <span className="text-text-muted text-[10px] font-normal">(Opsional)</span>
              </label>
              <select
                id="blood-type"
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out cursor-pointer"
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
              className="w-full h-[52px] mt-3 rounded-button bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-bold text-sm transition-all duration-200 ease-in-out flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
            >
              {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Profil Si Kecil 🧡'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----- RENDER DASHBOARD (Active Child Toggled) -----
  return (
    <div className="space-y-8 animate-fade-in px-0 font-[var(--font-body)]">
      {/* Dynamic Welcome Hero Banner */}
      <div className="bg-gradient-to-br from-primary to-secondary rounded-card p-6 text-white shadow-md shadow-primary/5 relative overflow-hidden">
        {/* Ambient premium background blur shapes */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
        
        <div className="relative space-y-4">
          <div>
            <p className="text-[12px] opacity-85 font-semibold tracking-wide uppercase">
              {timeGreeting}, Bunda {currentUser?.fullName?.split(' ')[0]} 🌟
            </p>
            <h2 className="text-xl font-extrabold font-[var(--font-heading)] leading-tight text-white mt-1">
              Aktivitas Si Kecil Hari Ini
            </h2>
          </div>
          
          {activeChild && (
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-2xl animate-pulse">👶</span>
              <div className="flex flex-col">
                <span className="text-[11px] text-white/70 font-semibold uppercase tracking-wider">Usia {activeChild.name} saat ini</span>
                <span className="text-base font-extrabold tracking-tight mt-0.5">
                  {ageString || 'Kalkulasi usia...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Core Active Child Profile Card - matching the empty state's clean design system */}
      {activeChild ? (
        <div className="bg-white rounded-card border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-6 space-y-6 hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out">
          <div className="flex items-center gap-4">
            {/* Elegant and gender-responsive pastel profile avatar */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-extrabold font-[var(--font-heading)] border ${
              activeChild.gender === 'L'
                ? 'bg-accent/10 border-accent/15 text-accent'
                : 'bg-primary/10 border-primary/15 text-primary'
            }`}>
              {activeChild.name ? activeChild.name.charAt(0).toUpperCase() : '👶'}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-extrabold font-[var(--font-heading)] text-gray-900 truncate">
                {activeChild.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Lahir pada {formatDate(activeChild.dateOfBirth)}
              </p>
            </div>

            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
              activeChild.gender === 'L'
                ? 'bg-accent/5 border-accent/10 text-accent'
                : 'bg-primary/5 border-primary/10 text-primary'
            }`}>
              {activeChild.gender === 'L' ? 'Laki-laki 👦' : 'Perempuan 👧'}
            </span>
          </div>

          <hr className="border-gray-100/80" />

          {/* Child Birth Parameters Grid */}
          <div className="grid grid-cols-3 gap-3.5 text-center">
            <div className="bg-gray-50/40 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Berat Lahir
              </p>
              <p className="text-sm font-extrabold text-gray-900 font-[var(--font-heading)] mt-1">
                {activeChild.birthWeightKg} <span className="text-[11px] font-semibold text-gray-500">kg</span>
              </p>
            </div>
            <div className="bg-gray-50/40 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Tinggi Lahir
              </p>
              <p className="text-sm font-extrabold text-gray-900 font-[var(--font-heading)] mt-1">
                {activeChild.birthHeightCm} <span className="text-[11px] font-semibold text-gray-500">cm</span>
              </p>
            </div>
            <div className="bg-gray-50/40 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Gol. Darah
              </p>
              <p className="text-sm font-extrabold text-gray-900 font-[var(--font-heading)] mt-1">
                {activeChild.bloodType || '-'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-card border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-6 text-center text-gray-500 text-sm">
          Menyiapkan data profil anak... 🧡
        </div>
      )}

    </div>
  );
}
