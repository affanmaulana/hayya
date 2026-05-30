import React, { useState, useContext, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChildContext } from '../context/ChildContext';
import { getAppData, saveAppData } from '../utils/localStorageUtils';

/**
 * Custom robust UUID generator with Date.now() + Math.random() fallback.
 */
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers or non-secure HTTP contexts
  return 'uuid-' + Date.now() + '-' + Math.floor(Math.random() * 1e9);
};

export default function OnboardingView() {
  const navigate = useNavigate();
  const { setCurrentUser } = useContext(AuthContext);
  const childContext = useContext(ChildContext);

  // Current onboarding step: 1 (Welcome), 2 (Mother name), 3 (Child info), or 'select_account'
  const [step, setStep] = useState(1);

  // All stored profiles (users) in the multi-account database
  const [storedAccounts, setStoredAccounts] = useState([]);

  // Step 2 States: Mother's Identity (persisted across back/forward)
  const [motherName, setMotherName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Step 3 States: Child's Info (persisted across back/forward)
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState(''); // 'L' (Laki-laki) or 'P' (Perempuan)

  // Validation & Loading States
  const [dateError, setDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all registered profiles on mount
  useEffect(() => {
    try {
      const appData = getAppData();
      if (appData && Array.isArray(appData.users)) {
        const activeUsers = appData.users.filter(u => u.isActive !== false);
        setStoredAccounts(activeUsers);
      }
    } catch (error) {
      console.error('Error fetching accounts from storage:', error);
    }
  }, []);

  // Get current date string for max input constraint
  const todayString = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Validate birth date whenever it changes
  useEffect(() => {
    if (!birthDate) {
      setDateError('');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(birthDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setDateError('Tanggal lahir tidak boleh di masa depan ya, Bunda. 🧡');
      return;
    }

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);
    twoYearsAgo.setHours(0, 0, 0, 0);

    if (selectedDate < twoYearsAgo) {
      setDateError('Aplikasi Hayya dirancang khusus untuk memantau tumbuh kembang si kecil hingga usia 2 tahun (24 bulan) ya, Bunda. 🧡');
      return;
    }

    setDateError('');
  }, [birthDate]);

  // Is Step 2 complete?
  const isStep2Valid = motherName.trim().length > 0;

  // Is Step 3 complete?
  const isStep3Valid = 
    childName.trim().length > 0 && 
    birthDate && 
    gender && 
    !dateError;

  const handleStep1Submit = () => {
    setStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    if (isStep2Valid) {
      setStep(3);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
  };

  const handleBackToStep2 = () => {
    setStep(2);
  };

  /**
   * Action to select a profile: logs in user instantly and sets active child.
   */
  const handleSelectAccount = (account) => {
    try {
      const appData = getAppData();
      // Find registered children under this account
      const userChildren = Array.isArray(appData.children)
        ? appData.children.filter(c => c.userId === account.id && c.isActive !== false)
        : [];

      // Determine active child ID
      let activeChildId = account.lastActiveChildId;
      if (!activeChildId && userChildren.length > 0) {
        activeChildId = userChildren[0].id;
      }

      // 1. Establish session keys in localStorage
      localStorage.setItem('hayya_active_user_id', account.id);
      if (activeChildId) {
        localStorage.setItem('hayya_active_child_id', activeChildId);
      } else {
        localStorage.removeItem('hayya_active_child_id');
      }

      // 2. Instantly update React context states
      if (setCurrentUser) {
        setCurrentUser(account);
      }
      if (childContext && typeof childContext.refreshChildren === 'function') {
        childContext.refreshChildren();
      }

      // 3. Immediately route to homepage
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error selecting returning profile:', error);
    }
  };

  const handleOnboardingComplete = async (e) => {
    e.preventDefault();
    if (!isStep3Valid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // 1. Generate IDs
      const userId = generateUUID();
      const childId = generateUUID();

      // 2. Fetch current localstorage database
      const appData = getAppData();

      // 3. Create User object (Mother)
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const newUser = {
        id: userId,
        phone: cleanPhone || '',
        pinHash: '', // Standard PIN-less registration for local onboarding
        fullName: motherName.trim(),
        profilePhoto: '',
        district: '',
        regency: '',
        province: '',
        lastActiveChildId: childId,
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 4. Create Child object
      const newChild = {
        id: childId,
        userId: userId,
        name: childName.trim(),
        dateOfBirth: birthDate,
        gender: gender,
        birthWeightKg: 3.0, // Healthy average default
        birthHeightCm: 50.0, // Healthy average default
        bloodType: '-',
        photoUrl: '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 5. Append records to Collections (relational multi-account flat arrays)
      appData.users = [...appData.users, newUser];
      appData.children = [...appData.children, newChild];

      // 6. Commit directly to our root key "hayya_app_data"
      saveAppData(appData);

      // 7. Write Active User & Child Session Keys to LocalStorage
      localStorage.setItem('hayya_active_user_id', userId);
      localStorage.setItem('hayya_active_child_id', childId);

      // 8. Update Context states
      // Flip the auth state to true globally
      if (setCurrentUser) {
        setCurrentUser(newUser);
      }

      // Sync ChildContext collections and mark the child active
      if (childContext && typeof childContext.refreshChildren === 'function') {
        childContext.refreshChildren();
      }

      // 9. Immediately route to homepage
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error during onboarding completion:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modern minimalist progress bar sub-component
  const renderProgressHeader = (currentStep) => {
    // If we're choosing an account, we don't display progress steps
    if (currentStep === 'select_account') return null;

    return (
      <div className="flex items-center gap-2 pb-2 w-full select-none">
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
          currentStep >= 1 ? 'bg-primary' : 'bg-border'
        }`} />
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
          currentStep >= 2 ? 'bg-primary' : 'bg-border'
        }`} />
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
          currentStep >= 3 ? 'bg-primary' : 'bg-border'
        }`} />
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center font-[var(--font-body)] antialiased select-none md:p-4">
      
      {/* --- STEP 1: WELCOME SCREEN --- */}
      {step === 1 && (
        <div className="w-full max-w-md mx-auto min-h-screen md:min-h-[90vh] bg-white flex flex-col justify-between px-6 pt-10 pb-8 box-border md:rounded-3xl md:border md:border-border/60 md:shadow-md animate-fade-in overflow-y-auto">
          {/* Upper Section */}
          <div className="space-y-6 flex-1 flex flex-col justify-start">
            {renderProgressHeader(1)}
            
            {/* Elegant Mobile Brand Centering */}
            <div className="text-center space-y-6 pt-12 md:pt-16">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/10 relative overflow-hidden">
                <span className="text-4xl text-white font-extrabold font-[var(--font-heading)] leading-none select-none">H</span>
              </div>
              <div className="space-y-3">
                <h1 className="text-2xl font-extrabold font-[var(--font-heading)] tracking-tight text-text leading-tight animate-fade-in">
                  Selamat Datang di Hayya
                </h1>
                <p className="text-sm text-text-secondary leading-relaxed max-w-[320px] mx-auto select-text">
                  Satu aplikasi praktis untuk memantau jadwal imunisasi, catatan tumbuh kembang, dan panduan resep MPASI buah hati Bunda.
                </p>
              </div>
            </div>
          </div>

          {/* Lower Section (Step 1 button hierarchy) */}
          <div className="space-y-3 pt-6 flex flex-col items-center w-full">
            {/* Always visible: Mulai dari Awal */}
            <button
              type="button"
              onClick={handleStep1Submit}
              className="w-full h-[52px] rounded-button bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
            >
              Mulai dari Awal 🌟
            </button>

            {/* Conditionally visible: Gunakan Akun Sebelumnya */}
            {storedAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => setStep('select_account')}
                className="w-full h-[52px] rounded-button border border-border text-text font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-bg/40"
              >
                Gunakan Akun Sebelumnya 👩‍🍼
              </button>
            )}
            
            <p className="text-center text-[11px] text-text-muted select-text pt-2">
              Offline-first & Data Aman tersimpan di HP Bunda 🔒
            </p>
          </div>
        </div>
      )}

      {/* --- STEP 2: MOTHER'S IDENTITY --- */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="w-full max-w-md mx-auto min-h-screen md:min-h-[90vh] bg-white flex flex-col justify-between px-6 pt-10 pb-8 box-border md:rounded-3xl md:border md:border-border/60 md:shadow-md animate-fade-in overflow-y-auto">
          {/* Upper Section */}
          <div className="space-y-6 flex-1 flex flex-col justify-start">
            {renderProgressHeader(2)}
            
            <div className="space-y-2 pt-4">
              <h1 className="text-2xl font-extrabold font-[var(--font-heading)] tracking-tight text-text leading-tight">
                Mengenal Bunda
              </h1>
              <p className="text-xs text-text-secondary leading-relaxed select-text">
                Yuk, isi nama panggilan Bunda untuk memudahkan sapaan personal di dalam aplikasi.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Mother Name Input */}
              <div className="space-y-1.5">
                <label htmlFor="mother-name" className="text-xs font-semibold text-text">
                  Nama Panggilan Bunda <span className="text-primary">*</span>
                </label>
                <input
                  id="mother-name"
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="Misal: Rini"
                  className="w-full h-11 px-4 border border-border rounded-input text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors"
                  required
                  autoFocus
                  autoComplete="name"
                />
              </div>

              {/* Optional Phone Input */}
              <div className="space-y-1.5">
                <label htmlFor="phone-number" className="text-xs font-semibold text-text">
                  Nomor Telepon <span className="text-text-muted text-[10px] font-normal">(Opsional)</span>
                </label>
                <input
                  id="phone-number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full h-11 px-4 border border-border rounded-input text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors"
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
            </div>
          </div>

          {/* Lower Section (Snaps to Bottom) */}
          <div className="space-y-3 pt-6">
            <button
              type="submit"
              disabled={!isStep2Valid}
              className={`w-full h-[52px] rounded-button font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isStep2Valid
                  ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/10 active:scale-[0.98]'
                  : 'bg-border text-text-muted cursor-not-allowed shadow-none'
              }`}
            >
              Lanjutkan
            </button>
            
            <button
              type="button"
              onClick={handleBackToStep1}
              className="w-full h-[52px] rounded-button border border-border text-text-secondary hover:bg-bg/40 font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer"
            >
              Kembali
            </button>
          </div>
        </form>
      )}

      {/* --- STEP 3: CHILD DATA --- */}
      {step === 3 && (
        <form onSubmit={handleOnboardingComplete} className="w-full max-w-md mx-auto min-h-screen md:min-h-[90vh] bg-white flex flex-col justify-between px-6 pt-10 pb-8 box-border md:rounded-3xl md:border md:border-border/60 md:shadow-md animate-fade-in overflow-y-auto">
          {/* Upper Section */}
          <div className="space-y-6 flex-1 flex flex-col justify-start">
            {renderProgressHeader(3)}
            
            <div className="space-y-2 pt-4">
              <h1 className="text-2xl font-extrabold font-[var(--font-heading)] tracking-tight text-text leading-tight">
                Data Buah Hati
              </h1>
              <p className="text-xs text-text-secondary leading-relaxed select-text">
                Catat data anak pertama Bunda untuk menyusun kalender imunisasi otomatis.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Child Name Input */}
              <div className="space-y-1.5">
                <label htmlFor="child-name" className="text-xs font-semibold text-text">
                  Nama Anak <span className="text-primary">*</span>
                </label>
                <input
                  id="child-name"
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Misal: Gani"
                  className="w-full h-11 px-4 border border-border rounded-input text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors"
                  required
                  autoFocus
                />
              </div>

              {/* Birth Date Picker */}
              <div className="space-y-1.5">
                <label htmlFor="birth-date" className="text-xs font-semibold text-text">
                  Tanggal Lahir <span className="text-primary">*</span>
                </label>
                <input
                  id="birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={todayString}
                  className={`w-full h-11 px-4 border rounded-input text-sm bg-bg-card focus:outline-none transition-colors cursor-pointer ${
                    dateError ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'
                  }`}
                  required
                />
                
                {dateError && (
                  <p className="text-[11px] text-danger font-medium leading-relaxed select-text mt-1">
                    {dateError}
                  </p>
                )}
              </div>

              {/* Minimalist Horizontal Gender Toggle Buttons */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-text">
                  Jenis Kelamin <span className="text-primary">*</span>
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('L')}
                    className={`flex-1 h-11 rounded-input border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none ${
                      gender === 'L'
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-border bg-bg-card text-text-secondary hover:bg-bg/40'
                    }`}
                  >
                    👦 Laki-laki
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('P')}
                    className={`flex-1 h-11 rounded-input border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none ${
                      gender === 'P'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-bg-card text-text-secondary hover:bg-bg/40'
                    }`}
                  >
                    👧 Perempuan
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lower Section (Snaps to Bottom) */}
          <div className="space-y-3 pt-6">
            <button
              type="submit"
              disabled={!isStep3Valid || isSubmitting}
              className={`w-full h-[52px] rounded-button font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isStep3Valid && !isSubmitting
                  ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/10 active:scale-[0.98]'
                  : 'bg-border text-text-muted cursor-not-allowed shadow-none'
              }`}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan & Selesai ✨'}
            </button>
            
            <button
              type="button"
              onClick={handleBackToStep2}
              className="w-full h-[52px] rounded-button border border-border text-text-secondary hover:bg-bg/40 font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer"
            >
              Kembali
            </button>
          </div>
        </form>
      )}

      {/* --- SUB-STEP: SELECT ACCOUNT VIEW --- */}
      {step === 'select_account' && (
        <div className="w-full max-w-md mx-auto min-h-screen md:min-h-[90vh] bg-white flex flex-col justify-between px-6 pt-10 pb-8 box-border md:rounded-3xl md:border md:border-border/60 md:shadow-md animate-fade-in overflow-y-auto">
          {/* Upper Section */}
          <div className="space-y-6 flex-1 flex flex-col justify-start">
            
            <div className="space-y-2 pt-4 border-b border-border/50 pb-4">
              <h1 className="text-2xl font-extrabold font-[var(--font-heading)] tracking-tight text-text leading-tight">
                Pilih Akun Bunda
              </h1>
              <p className="text-xs text-text-secondary leading-relaxed">
                Silakan pilih profil Bunda yang sudah terdaftar sebelumnya untuk melanjutkan aktivitas.
              </p>
            </div>

            {/* Vertical Account List */}
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {storedAccounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => handleSelectAccount(account)}
                  className="flex items-center gap-4 p-4 border border-border rounded-input hover:border-primary hover:bg-primary/5 active:scale-[0.99] transition-all cursor-pointer select-none"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-lg text-primary font-bold">
                    👩‍🍼
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-text truncate">
                      Bunda {account.fullName}
                    </h4>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {account.phone ? `📞 ${account.phone}` : 'Tanpa Nomor HP'}
                    </p>
                  </div>
                  <div className="text-primary text-xs font-bold font-[var(--font-heading)]">
                    Pilih &rarr;
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lower Section (Snaps to Bottom) */}
          <div className="pt-6">
            <button
              type="button"
              onClick={handleBackToStep1}
              className="w-full h-[52px] rounded-button border border-border text-text-secondary hover:bg-bg/40 font-semibold text-xs transition-colors flex items-center justify-center cursor-pointer"
            >
              Kembali ke Menu Utama
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
