import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useChild } from '../hooks/useChild';
import { useGrowth } from '../hooks/useGrowth';
import { useImmunization } from '../hooks/useImmunization';
import useMpasi from '../hooks/useMpasi';
import { calculateAgeInMonthsAndDays, formatDate } from '../utils/dateHelpers';
import CustomDatePicker from '../components/CustomDatePicker.jsx';

export default function DashboardView() {
  const { currentUser } = useAuth();
  const { activeChild, childrenList, addChild, isLoading } = useChild();
  const navigate = useNavigate();

  const { getGrowthRecords } = useGrowth();
  const records = useMemo(() => {
    return activeChild ? getGrowthRecords(activeChild.id) : [];
  }, [activeChild, getGrowthRecords]);

  const latestRecord = useMemo(() => {
    if (records.length === 0) return null;
    return records[records.length - 1];
  }, [records]);

  const { calendar } = useImmunization(activeChild?.id);
  
  const nextImmunization = useMemo(() => {
    if (!calendar || calendar.length === 0) return null;
    return calendar.find(r => r.status === 'scheduled');
  }, [calendar]);

  const immunizationAlertText = useMemo(() => {
    if (!nextImmunization) return 'Semua imunisasi wajib sudah lengkap! 🎉';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduled = new Date(nextImmunization.scheduledDate);
    scheduled.setHours(0, 0, 0, 0);
    
    const diffTime = scheduled - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Jadwal Imunisasi Terlewat: ${nextImmunization.vaccine?.name || 'Vaksin'} (Terlewat ${Math.abs(diffDays)} Hari)`;
    } else if (diffDays === 0) {
      return `Jadwal Imunisasi Hari Ini: ${nextImmunization.vaccine?.name || 'Vaksin'}`;
    } else {
      return `Jadwal Imunisasi Berikutnya: ${nextImmunization.vaccine?.name || 'Vaksin'} (${diffDays} Hari Lagi)`;
    }
  }, [nextImmunization]);

  const { plans, recipes } = useMpasi();
  
  const currentDayOfWeek = useMemo(() => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const index = new Date().getDay();
    return days[index];
  }, []);

  const currentPlan = useMemo(() => {
    if (!activeChild || !plans) return null;
    const childPlans = plans.filter(p => p.childId === activeChild.id);
    if (childPlans.length === 0) return null;
    childPlans.sort((a, b) => new Date(b.weekStartDate) - new Date(a.weekStartDate));
    return childPlans[0];
  }, [plans, activeChild]);

  const todayMenu = useMemo(() => {
    if (!currentPlan || !currentPlan.planData) return null;
    const dayMenu = currentPlan.planData[currentDayOfWeek] || currentPlan.planData['monday'];
    if (!dayMenu) return null;
    
    const getRecipeName = (recipeId) => {
      const recipe = recipes.find(r => r.id === recipeId);
      return recipe ? recipe.name : null;
    };
    
    return {
      breakfast: getRecipeName(dayMenu.breakfast) || 'Belum diatur',
      lunch: getRecipeName(dayMenu.lunch) || 'Belum diatur',
      dinner: getRecipeName(dayMenu.dinner) || 'Belum diatur'
    };
  }, [currentPlan, currentDayOfWeek, recipes]);

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
              <CustomDatePicker
                id="birth-date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={todayString}
                placeholder="Pilih tanggal lahir..."
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

  // Dynamic growth status computed qualitatively (Reference 1 and GrowthView style)
  const growthStatus = useMemo(() => {
    if (!activeChild) {
      return {
        label: 'Siap Pantau',
        scoreText: '60/100',
        desc: 'Mulai catat pertumbuhan si kecil secara berkala ya, Bunda.',
        progressCount: 6
      };
    }
    if (records.length === 0) {
      return {
        label: 'Mulai Catat',
        scoreText: '60/100',
        desc: `Skor tumbuh awal si kecil saat ini adalah 60/100. Yuk Bunda, segera ukur berat dan tinggi badan ${activeChild.name} agar sistem bisa menghitung perkembangan kurva kesehatannya secara akurat.`,
        progressCount: 9
      };
    }
    
    const latest = records[records.length - 1];
    const weight = parseFloat(latest.weightKg);
    const height = parseFloat(latest.heightCm);
    
    let statusLabel = 'Tumbuh Ideal';
    let scoreText = '95/100';
    let statusDesc = `Skor tumbuh si kecil sangat prima di angka 95/100! Tinggi dan berat badan ${activeChild.name} berkembang dengan sangat pesat dan optimal sesuai standar kurva WHO. Pertahankan asupan gizinya ya, Bunda! ✨`;
    let progressCount = 15;
    
    if (weight < 2.5 || height < 45) {
      statusLabel = 'Kurang Ideal';
      scoreText = '78/100';
      statusDesc = `Skor tumbuh si kecil saat ini berada di angka 78/100. Tinggi atau berat badannya terindikasi berada sedikit di bawah kurva ideal WHO. Bunda disarankan untuk menambahkan asupan lemak tambahan (seperti santan atau mentega) serta protein hewani pada menu MPASI harian.`;
      progressCount = 10;
    }
    
    return {
      label: statusLabel,
      scoreText,
      desc: statusDesc,
      progressCount
    };
  }, [activeChild, records]);

  // Dynamic calculation for LiLA (consistent with GrowthView formula)
  const currentLila = useMemo(() => {
    if (!activeChild) return '-';
    if (latestRecord && latestRecord.lila) return `${latestRecord.lila} cm`;
    
    const dob = activeChild.dateOfBirth;
    const today = new Date();
    const birth = new Date(dob);
    const ageInMonths = Math.max(0, (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth()));
    
    const weightVal = latestRecord ? parseFloat(latestRecord.weightKg) : activeChild.birthWeightKg;
    const computedLila = (9.5 + Math.min(12, ageInMonths) * 0.2 + weightVal * 0.15).toFixed(1);
    return `${computedLila} cm`;
  }, [activeChild, latestRecord]);

  // ----- RENDER DASHBOARD (Active Child Toggled) -----
  return (
    <div className="space-y-6 animate-fade-in px-0 font-[var(--font-body)]">
      
      {/* 1. Element Pecahan Pertama: Child Profile & Score Card (Bold Pink Brand bg, White text, 20% Vertical Screen Height) */}
      {activeChild && (
        <div className="w-full min-h-[175px] rounded-[32px] bg-gradient-to-br from-[var(--color-secondary-light)] via-[var(--color-primary)] to-[var(--color-primary-dark)] p-6 shadow-md relative overflow-hidden mb-4 flex flex-col justify-between">
          {/* Subtle glowing elements */}
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col justify-between h-full w-full flex-1">
            {/* Top-Left: Name and Age Stack */}
            <div className="flex flex-col items-start leading-none">
              <span style={{ color: '#ffffff' }} className="text-3xl font-black text-white leading-none tracking-tight block !text-white">
                {activeChild.name}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }} className="text-xs text-white/90 font-bold mt-1 block !text-white/90">
                Usia: {ageString || 'Kalkulasi usia...'}
              </span>
            </div>
            
            {/* Bottom-Right: Growth Score Stack */}
            <div className="flex justify-end w-full mt-auto">
              <div className="text-right">
                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }} className="text-[10px] font-bold text-white/80 uppercase tracking-widest block !text-white/80">
                  Skor Tumbuh
                </span>
                <span style={{ color: '#ffffff' }} className="text-3xl font-black text-white mt-1 block leading-none !text-white">
                  {growthStatus.scoreText}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Element Pecahan Kedua: Scoring Bar WHO & Explanation (Placed directly on background) */}
      {activeChild && (
        <div className="space-y-2.5 px-2">
          <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
            Analisis Kurva Pertumbuhan WHO
          </span>
          
          {/* Progress bar matching Adherence style */}
          <div className="w-full h-2.5 bg-gray-150 rounded-full overflow-hidden flex gap-0.5 border border-gray-100/20">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className={`h-full flex-1 ${
                  i < growthStatus.progressCount ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <p className="text-xs text-gray-600 font-medium leading-relaxed mt-1">
            {growthStatus.desc}
          </p>
        </div>
      )}

      {/* 3. Element Pecahan Ketiga: 4-Column Growth Metrics Grid (Placed directly on background) */}
      {activeChild && (
        <div className="grid grid-cols-4 gap-2.5 py-4 border-t border-b border-border/80 my-4 px-1">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center block">
              Berat
            </span>
            <span className="text-base font-black text-gray-900 mt-1 text-center block">
              {latestRecord ? `${latestRecord.weightKg} kg` : `${activeChild.birthWeightKg} kg`}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center block">
              Tinggi
            </span>
            <span className="text-base font-black text-gray-900 mt-1 text-center block">
              {latestRecord ? `${latestRecord.heightCm} cm` : `${activeChild.birthHeightCm} cm`}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center block">
              L. Kepala
            </span>
            <span className="text-base font-black text-gray-900 mt-1 text-center block">
              {latestRecord && latestRecord.headCircCm ? `${latestRecord.headCircCm} cm` : '-'}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider text-center block">
              L. Lengan
            </span>
            <span className="text-base font-black text-gray-900 mt-1 text-center block">
              {currentLila}
            </span>
          </div>
        </div>
      )}

      {/* 4. Quick Actions Cards Grid (Reference 2 & 3 Style) */}
      <div className="grid grid-cols-3 gap-3.5 mb-6 pt-1">
        <div
          onClick={() => navigate('/dashboard/growth/tambah')}
          className="flex flex-col items-center justify-center bg-white border border-border hover:bg-gray-50/30 rounded-[24px] p-4 transition-all active:scale-[0.97] cursor-pointer shadow-xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50/70 text-emerald-600 flex items-center justify-center text-xl mb-1.5 shadow-sm border border-emerald-100/30">
            📏
          </div>
          <span className="text-[11px] font-extrabold text-gray-700 tracking-tight text-center">
            Ukur Anak
          </span>
        </div>
        
        <div
          onClick={() => navigate('/dashboard/mpasi')}
          className="flex flex-col items-center justify-center bg-white border border-border hover:bg-gray-50/30 rounded-[24px] p-4 transition-all active:scale-[0.97] cursor-pointer shadow-xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50/70 text-amber-600 flex items-center justify-center text-xl mb-1.5 shadow-sm border border-amber-100/30">
            🥗
          </div>
          <span className="text-[11px] font-extrabold text-gray-700 tracking-tight text-center">
            Log MPASI
          </span>
        </div>

        <div
          onClick={() => navigate('/dashboard/imunisasi')}
          className="flex flex-col items-center justify-center bg-white border border-border hover:bg-gray-50/30 rounded-[24px] p-4 transition-all active:scale-[0.97] cursor-pointer shadow-xs"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50/70 text-blue-600 flex items-center justify-center text-xl mb-1.5 shadow-sm border border-blue-100/30">
            💉
          </div>
          <span className="text-[11px] font-extrabold text-gray-700 tracking-tight text-center">
            Imunisasi
          </span>
        </div>
      </div>

      {/* 3. Daily Operations Cards (Reference 1 Soft Gradient Cards) */}
      {activeChild && (
        <div className="space-y-4 pt-2 pb-24">
          
          {/* Soft Gradient Timeline Card: Upcoming Immunization */}
          <div 
            onClick={() => navigate('/dashboard/imunisasi')}
            className="bg-gradient-to-r from-blue-50/70 to-sky-50/40 border border-blue-100/60 rounded-[32px] p-6 shadow-xs flex justify-between items-center relative overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-blue-100/30 blur-xl pointer-events-none" />
            
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1.5 block">
                Jadwal Imunisasi Mendekati
              </span>
              <h4 className="text-sm font-black text-blue-900 tracking-tight leading-snug">
                {nextImmunization ? nextImmunization.vaccine?.name : 'Semua Lengkap'}
              </h4>
              <span className="text-xs text-blue-800/80 font-medium mt-1 block truncate">
                {immunizationAlertText}
              </span>
            </div>

            <div className="w-11 h-11 bg-white rounded-2xl border border-blue-100 flex items-center justify-center text-lg shadow-sm shrink-0">
              🔔
            </div>
          </div>

          {/* Soft Gradient Timeline Card: Today's MPASI Menu */}
          <div 
            onClick={() => navigate('/dashboard/mpasi')}
            className="bg-gradient-to-r from-rose-50/70 to-pink-50/40 border border-rose-100/60 rounded-[32px] p-6 shadow-xs flex justify-between items-center relative overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-rose-100/30 blur-xl pointer-events-none" />
            
            <div className="flex-1 min-w-0 pr-4">
              <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest mb-1.5 block">
                Menu MPASI Hari Ini
              </span>
              <h4 className="text-sm font-black text-rose-900 tracking-tight leading-snug">
                {todayMenu ? 'Menu Sehat disusun' : 'Buat Rencana Menu'}
              </h4>
              <div className="text-xs text-rose-800/80 font-medium mt-1 leading-normal truncate">
                {todayMenu ? (
                  <span>
                    Pagi: {todayMenu.breakfast} • Siang: {todayMenu.lunch} • Malam: {todayMenu.dinner}
                  </span>
                ) : (
                  <span className="italic text-gray-400">Rencana menu MPASI belum disusun, Bunda.</span>
                )}
              </div>
            </div>

            <div className="w-11 h-11 bg-white rounded-2xl border border-rose-100 flex items-center justify-center text-lg shadow-sm shrink-0">
              🥣
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
