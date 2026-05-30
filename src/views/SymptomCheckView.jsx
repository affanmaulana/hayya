import { useState, useMemo, useRef } from 'react';
import { useChild } from '../hooks/useChild';
import useAuth from '../hooks/useAuth';
import useSymptomCheck from '../hooks/useSymptomCheck';
import { useEducation } from '../hooks/useEducation';
import { calculateAgeInMonthsAndDays } from '../utils/dateHelpers';

export default function SymptomCheckView({ onBack }) {
  const { activeChild, childrenList, setActiveChildId } = useChild();
  const { currentUser } = useAuth();
  const { runSymptomCheck } = useSymptomCheck();
  const { savedArticlesList, toggleBookmarkArticle } = useEducation();

  // Wizard state: 1 (Symptoms), 2 (Details), 3 (Red Flags), 4 (Results)
  const [step, setStep] = useState(1);

  // Form states
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [answers, setAnswers] = useState({
    suhu: '',
    durasi_demam: '',
    diare_frekuensi: '',
    diare_darah: '',
    batuk_sesak: '',
    muntah_terus: '',
    ruam_penyebaran: ''
  });
  const [selectedRedFlags, setSelectedRedFlags] = useState([]);
  const [hasNoRedFlags, setHasNoRedFlags] = useState(false);
  const [tempError, setTempError] = useState('');

  // Assessment results stored after Step 3 submit
  const [assessmentResult, setAssessmentResult] = useState(null);

  // Calculate age string for active child in months and days
  const childAgeString = useMemo(() => {
    if (!activeChild || !activeChild.dateOfBirth) return '';
    const { months, days } = calculateAgeInMonthsAndDays(activeChild.dateOfBirth);
    return `${months} Bulan ${days} Hari`;
  }, [activeChild]);

  // Desktop drag-to-scroll support for child switcher
  const childTrackRef = useRef(null);
  const [childDragState, setChildDragState] = useState({
    isDown: false,
    startX: 0,
    scrollLeft: 0
  });

  const handleChildMouseDown = (e) => {
    const track = childTrackRef.current;
    if (!track) return;
    setChildDragState({
      isDown: true,
      startX: e.pageX - track.offsetLeft,
      scrollLeft: track.scrollLeft
    });
  };

  const handleChildMouseLeave = () => {
    setChildDragState(prev => ({ ...prev, isDown: false }));
  };

  const handleChildMouseUp = () => {
    setChildDragState(prev => ({ ...prev, isDown: false }));
  };

  const handleChildMouseMove = (e) => {
    if (!childDragState.isDown) return;
    e.preventDefault();
    const track = childTrackRef.current;
    if (!track) return;
    const x = e.pageX - track.offsetLeft;
    const walk = (x - childDragState.startX) * 1.5;
    track.scrollLeft = childDragState.scrollLeft - walk;
  };

  // Master lists of critical signs
  const RED_FLAGS_OPTIONS = [
    'Anak sangat lemas, sulit dibangunkan, atau mengalami penurunan kesadaran.',
    'Napas anak sangat cepat atau tampak sesak napas (terdapat tarikan kulit yang dalam pada dinding dada saat bernapas).',
    'Anak mengalami kejang-kejang.',
    'Ujung tangan dan kaki teraba sangat dingin, basah, dan tampak pucat atau kebiruan.',
    'Anak tidak buang air kecil (pipis) sama sekali dalam 6 jam terakhir.',
    'Terjadi pendarahan spontan seperti mimisan, gusi berdarah, atau bintik-bintik merah gelap yang tidak pudar saat ditekan.'
  ];

  // Check if an article is bookmarked
  const isArticleBookmarked = (articleId) => {
    return savedArticlesList.some(
      item => item.articleId === articleId && item.userId === currentUser?.id
    );
  };

  // Toggle bookmark re-using hook
  const handleBookmarkToggle = (e, articleId) => {
    e.stopPropagation();
    if (!currentUser?.id) return;
    try {
      toggleBookmarkArticle(currentUser.id, articleId);
    } catch (err) {
      console.error('Error toggling article bookmark:', err);
    }
  };

  // Handle main symptoms select
  const toggleSymptom = (sym) => {
    setSelectedSymptoms(prev => 
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  // Handle answers input & custom validation for temperature
  const handleAnswerChange = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    
    if (key === 'suhu') {
      const parsed = parseFloat(value);
      if (value === '') {
        setTempError('');
      } else if (isNaN(parsed) || parsed < 34.0 || parsed > 43.0) {
        setTempError('Bunda, mohon masukkan nilai suhu tubuh yang valid di antara 34.0°C hingga 43.0°C.');
      } else {
        setTempError('');
      }
    }
  };

  // Handle red flags select with mutual exclusivity logic
  const handleRedFlagChange = (flag) => {
    setHasNoRedFlags(false);
    setSelectedRedFlags(prev =>
      prev.includes(flag) ? prev.filter(f => f !== flag) : [...prev, flag]
    );
  };

  const handleNoRedFlagsChange = () => {
    const newVal = !hasNoRedFlags;
    setHasNoRedFlags(newVal);
    if (newVal) {
      setSelectedRedFlags([]);
    }
  };

  // Step transitions
  const handleNextToDetails = () => {
    if (selectedSymptoms.length > 0) {
      // Pre-populate some defaults if not set to prevent empty form validation errors
      const updatedAnswers = { ...answers };
      
      if (selectedSymptoms.includes('demam') && !updatedAnswers.durasi_demam) {
        updatedAnswers.durasi_demam = 'Kurang dari 3 hari';
      }
      if (selectedSymptoms.includes('diare')) {
        if (!updatedAnswers.diare_frekuensi) updatedAnswers.diare_frekuensi = 'Kurang dari 4 kali';
        if (!updatedAnswers.diare_darah) updatedAnswers.diare_darah = 'Tidak ada';
      }
      if (selectedSymptoms.includes('batuk') && !updatedAnswers.batuk_sesak) {
        updatedAnswers.batuk_sesak = 'Tidak';
      }
      if (selectedSymptoms.includes('muntah') && !updatedAnswers.muntah_terus) {
        updatedAnswers.muntah_terus = 'Tidak';
      }
      if (selectedSymptoms.includes('ruam') && !updatedAnswers.ruam_penyebaran) {
        updatedAnswers.ruam_penyebaran = 'Tidak';
      }
      
      setAnswers(updatedAnswers);
      setStep(2);
    }
  };

  const handleNextToRedFlags = () => {
    // If demam is selected, check temp validation before moving on
    if (selectedSymptoms.includes('demam')) {
      const parsedVal = parseFloat(answers.suhu);
      if (answers.suhu === '' || isNaN(parsedVal) || parsedVal < 34.0 || parsedVal > 43.0) {
        setTempError('Bunda, mohon masukkan nilai suhu tubuh yang valid di antara 34.0°C hingga 43.0°C.');
        return;
      }
    }
    setStep(3);
  };

  // Submit assessment logic
  const handleSubmitAssessment = () => {
    if (!activeChild?.id) return;
    
    // Safety check that user clicked either a red flag or "no flags"
    if (selectedRedFlags.length === 0 && !hasNoRedFlags) {
      return;
    }

    try {
      // Map form keys matching hook expected evaluation keys
      const formattedAnswers = {
        ...answers,
        // map yes/no options appropriately for strict boolean detections in hook
        diare_darah: answers.diare_darah === 'Ada darah atau lendir' ? 'Ada darah atau lendir' : 'Tidak ada',
        konsistensi: answers.diare_darah === 'Ada darah atau lendir' ? 'Ada darah atau lendir' : 'Tidak ada',
        muntah_terus: answers.muntah_terus === 'Ya, selalu muntah' ? 'Ya, selalu muntah' : 'Tidak',
        muntah_keparahan: answers.muntah_terus === 'Ya, selalu muntah' ? 'Ya, selalu muntah' : 'Tidak',
        batuk_sesak: answers.batuk_sesak === 'Ya' ? 'Ya' : 'Tidak',
        batuk_intensitas: answers.batuk_sesak === 'Ya' ? 'Ya' : 'Tidak'
      };

      const result = runSymptomCheck(
        activeChild.id,
        selectedSymptoms,
        formattedAnswers,
        hasNoRedFlags ? ['Tidak ada tanda bahaya di atas (Kondisi Stabil)'] : selectedRedFlags
      );
      
      setAssessmentResult(result);
      setStep(4);
    } catch (error) {
      alert(error.message);
    }
  };

  // Helper to format urgency level styles
  const getUrgencyConfig = (level) => {
    switch (level) {
      case 'emergency':
        return {
          icon: '🔴',
          label: 'SEGERA BAWA KE IGD / DOKTER! 🏥',
          desc: 'Kondisi si kecil membutuhkan pemeriksaan medis segera oleh dokter atau di Instalasi Gawat Darurat (IGD) terdekat.',
          style: 'bg-danger/10 border-2 border-danger text-danger'
        };
      case 'doctor':
        return {
          icon: '🟡',
          label: 'Jadwalkan Pemeriksaan ke Dokter 🩺',
          desc: 'Kondisi si kecil sebaiknya diperiksa langsung oleh dokter untuk mendapatkan penanganan dan resep obat yang tepat.',
          style: 'bg-warning/10 border-2 border-warning text-warning-dark text-[#856404]'
        };
      case 'home':
      default:
        return {
          icon: '🟢',
          label: 'Perawatan Mandiri & Pemantauan di Rumah 🏡',
          desc: 'Kondisi si kecil terpantau aman dan stabil untuk dirawat secara mandiri di rumah dengan pemantauan teratur.',
          style: 'bg-accent/10 border-2 border-accent text-accent'
        };
    }
  };

  // Reset check and go back to step 1
  const handleResetCheck = () => {
    setSelectedSymptoms([]);
    setAnswers({
      suhu: '',
      durasi_demam: '',
      diare_frekuensi: '',
      diare_darah: '',
      batuk_sesak: '',
      muntah_terus: '',
      ruam_penyebaran: ''
    });
    setSelectedRedFlags([]);
    setHasNoRedFlags(false);
    setTempError('');
    setAssessmentResult(null);
    setStep(1);
  };

  // Print function helper
  const handleShareResult = () => {
    window.print();
  };

  // Empty profile state check
  if (!activeChild) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-5 font-[var(--font-body)]">
        <div className="w-20 h-20 bg-secondary/5 rounded-full flex items-center justify-center text-3xl shadow-sm border border-secondary/10">
          🩺
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold font-[var(--font-heading)] text-text">
            Bunda Belum Memilih Profil Si Kecil
          </h2>
          <p className="text-sm text-text-secondary max-w-[280px] leading-relaxed mx-auto">
            Yuk, daftarkan atau pilih profil si kecil terlebih dahulu di Beranda untuk menggunakan modul Cek Gejala Anak. 🧡
          </p>
        </div>
        <button
          onClick={onBack}
          className="h-11 px-6 rounded-button bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors shadow-md shadow-primary/10 cursor-pointer"
        >
          Kembali ke Profil
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-[var(--font-body)] px-0 py-4 animate-fade-in pb-10">
      
      {/* Header section with Back navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={step === 4 ? handleResetCheck : onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all duration-200 ease-in-out cursor-pointer focus:outline-none active:scale-95"
          aria-label="Kembali"
        >
          <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-xl font-bold font-[var(--font-heading)] text-gray-900 tracking-tight">
          Cek Gejala Sakit Anak 🩺
        </h2>
      </div>

      {/* Horizontal Child Switcher Scroll */}
      <div className="w-full max-w-full overflow-hidden select-none bg-white rounded-card border border-gray-100 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-3">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
          Pilih Profil Anak Yang Ingin Diperiksa
        </span>
        <div className="w-full max-w-full overflow-hidden">
          <div 
            ref={childTrackRef}
            onMouseDown={handleChildMouseDown}
            onMouseLeave={handleChildMouseLeave}
            onMouseUp={handleChildMouseUp}
            onMouseMove={handleChildMouseMove}
            className="flex flex-row overflow-x-auto whitespace-nowrap scroll-smooth gap-3 pb-2"
            style={{ 
              touchAction: 'pan-x',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {childrenList.map((child) => {
              const isSelected = child.id === activeChild?.id;
              const { months, days } = calculateAgeInMonthsAndDays(child.dateOfBirth);
              return (
                <button
                  key={child.id}
                  onClick={() => setActiveChildId(child.id)}
                  className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ease-in-out min-w-[200px] select-none active:scale-[0.98] ${
                    isSelected
                      ? 'border-primary bg-primary/[0.03] shadow-sm'
                      : 'border-gray-200 bg-white hover:bg-gray-50/50 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border transition-transform duration-200 ${
                    isSelected ? 'scale-105' : ''
                  } ${
                    child.gender === 'L'
                      ? 'bg-accent/10 border-accent/15 text-accent'
                      : 'bg-primary/10 border-primary/15 text-primary'
                  }`}>
                    {child.name ? child.name.charAt(0).toUpperCase() : '👶'}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">
                      {isSelected ? 'Memeriksa Profil' : 'Pilih Profil'}
                    </span>
                    <span className="text-xs font-extrabold text-gray-900 block truncate">{child.name}</span>
                    <span className="text-[10px] font-bold text-primary block mt-0.5">
                      Usia {months} Bulan {days} Hari
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Progress step dots */}
      {step < 4 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s 
                  ? 'w-6 bg-primary' 
                  : s < step 
                    ? 'w-2 bg-primary/40' 
                    : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {/* ================= STEP 1: CHOOSE MAIN SYMPTOMS ================= */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Sapaan hangat & Medical Disclaimer Card */}
          <div className="bg-amber-50/60 border border-amber-100 rounded-card p-4 space-y-2 text-xs text-amber-900 leading-relaxed shadow-sm">
            <p className="font-bold text-amber-800">
              Halo Bunda, ada keluhan apa dengan si kecil hari ini? Yuk, kita cek gejalanya. 🧡
            </p>
            <div className="flex gap-2 items-start mt-1.5 text-amber-700 bg-white/60 p-2.5 rounded-lg border border-amber-100/50">
              <span className="text-sm shrink-0">⚠️</span>
              <p className="font-medium text-[11px] leading-relaxed">
                <strong>Perhatian Bunda:</strong> Fitur ini hanya memberikan panduan awal pertolongan pertama berdasarkan gejala luar dan bukan pengganti diagnosis dokter medis profesional.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-card border border-gray-100 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-4 hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold font-[var(--font-heading)] text-gray-900">
                Pilih Gejala Utama Si Kecil
              </h3>
              <p className="text-xs text-gray-500">
                Bunda bisa mencentang lebih dari satu gejala yang dirasakan si kecil saat ini:
              </p>
            </div>

            {/* Checkbox grid with thumb-friendly touch sizes */}
            <div className="space-y-2.5 pt-1">
              {[
                { id: 'demam', label: 'Demam (Suhu Tubuh Panas/Hangat)', emoji: '🔥' },
                { id: 'diare', label: 'Diare (BAB Cair / Sering)', emoji: '💧' },
                { id: 'batuk', label: 'Batuk / Pilek / Hidung Tersumbat', emoji: '🤧' },
                { id: 'muntah', label: 'Muntah (Isi Lambung Menyembur)', emoji: '🤮' },
                { id: 'ruam', label: 'Ruam Popok / Kulit Kemerahan', emoji: '🔴' }
              ].map((item) => {
                const isChecked = selectedSymptoms.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleSymptom(item.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 ease-in-out min-h-[52px] select-none active:scale-[0.99] ${
                      isChecked
                        ? 'border-primary bg-primary/[0.02] shadow-sm'
                        : 'border-gray-200 bg-white hover:bg-gray-50/50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-xl">{item.emoji}</span>
                      <span className="text-xs font-bold text-gray-900">{item.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isChecked 
                        ? 'bg-primary border-primary text-white' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isChecked && (
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedSymptoms.length === 0 && (
              <p className="text-[11px] text-gray-400 font-medium text-center pt-2">
                Bunda, pilih minimal satu gejala utama si kecil untuk melanjutkan skrining. 🧡
              </p>
            )}

            <button
              onClick={handleNextToDetails}
              disabled={selectedSymptoms.length === 0}
              className={`w-full h-12 rounded-button text-xs font-bold transition-all duration-200 ease-in-out shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                selectedSymptoms.length > 0
                  ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/10 active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span>Lanjut ke Detail Gejala</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: DYNAMIC QUESTIONNAIRE ================= */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-white rounded-card border border-gray-100 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold font-[var(--font-heading)] text-gray-900">
                Detail Pemeriksaan Gejala
              </h3>
              <p className="text-xs text-gray-500">
                Jawab pertanyaan singkat berikut untuk membantu kami memetakan pertolongan pertama yang sesuai:
              </p>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-5">
              {/* --- DEMAM QUESTIONS --- */}
              {selectedSymptoms.includes('demam') && (
                <div className="space-y-3.5 p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">🔥 Gejala Demam</span>
                  
                  {/* Temp input field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 block">
                      Berapa suhu tubuh si kecil saat ini? (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Contoh: 38.5"
                      value={answers.suhu}
                      onChange={(e) => handleAnswerChange('suhu', e.target.value)}
                      className="w-full h-11 px-4 text-xs rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none bg-white font-medium transition-all duration-200"
                    />
                    {tempError ? (
                      <p className="text-[10px] text-danger font-semibold bg-danger/5 p-2 rounded-lg border border-danger/10">
                        ⚠️ {tempError}
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400">Masukkan nilai suhu badan dengan angka desimal.</p>
                    )}
                  </div>

                  {/* Duration input */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 block">
                      Berapa lama demam si kecil sudah berlangsung?
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {['Kurang dari 3 hari', '3 hari atau lebih'].map((opt) => {
                        const isSel = answers.durasi_demam === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleAnswerChange('durasi_demam', opt)}
                            className={`p-3 text-xs font-bold rounded-lg border text-center transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                              isSel
                                ? 'bg-primary border-primary text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50/50 hover:border-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* --- DIARE QUESTIONS --- */}
              {selectedSymptoms.includes('diare') && (
                <div className="space-y-4 p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">💧 Gejala Diare</span>

                  {/* Frequency check */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 block">
                      Berapa kali buang air besar cair dalam 24 jam terakhir?
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {['Kurang dari 4 kali', '4 kali atau lebih'].map((opt) => {
                        const isSel = answers.diare_frekuensi === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleAnswerChange('diare_frekuensi', opt)}
                            className={`p-3 text-xs font-bold rounded-lg border text-center transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                              isSel
                                ? 'bg-primary border-primary text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50/50 hover:border-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Consistency check */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 block">
                      Apakah ada bercak darah atau lendir pada tinja si kecil?
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {['Tidak ada', 'Ada darah atau lendir'].map((opt) => {
                        const isSel = answers.diare_darah === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleAnswerChange('diare_darah', opt)}
                            className={`p-3 text-xs font-bold rounded-lg border text-center transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                              isSel
                                ? 'bg-primary border-primary text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50/50 hover:border-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* --- BATUK QUESTIONS --- */}
              {selectedSymptoms.includes('batuk') && (
                <div className="space-y-3 p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">🤧 Gejala Batuk</span>
                  
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 block">
                      Apakah batuk si kecil terdengar sesak atau disertai bunyi 'ngik' (mengi)?
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {['Tidak', 'Ya'].map((opt) => {
                        const isSel = answers.batuk_sesak === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleAnswerChange('batuk_sesak', opt)}
                            className={`p-3 text-xs font-bold rounded-lg border text-center transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                              isSel
                                ? 'bg-primary border-primary text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50/50 hover:border-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* --- MUNTAH QUESTIONS --- */}
              {selectedSymptoms.includes('muntah') && (
                <div className="space-y-3 p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">🤮 Gejala Muntah</span>
                  
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 block">
                      Apakah si kecil muntah terus-menerus setiap kali diberikan makan atau minum?
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {['Tidak', 'Ya, selalu muntah'].map((opt) => {
                        const isSel = answers.muntah_terus === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleAnswerChange('muntah_terus', opt)}
                            className={`p-3 text-xs font-bold rounded-lg border text-center transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                              isSel
                                ? 'bg-primary border-primary text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50/50 hover:border-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* --- RUAM QUESTIONS --- */}
              {selectedSymptoms.includes('ruam') && (
                <div className="space-y-3 p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">🔴 Gejala Ruam</span>
                  
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-700 block">
                      Apakah ruam merah muncul merata di seluruh tubuh setelah demamnya mulai turun?
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {['Tidak', 'Ya'].map((opt) => {
                        const isSel = answers.ruam_penyebaran === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => handleAnswerChange('ruam_penyebaran', opt)}
                            className={`p-3 text-xs font-bold rounded-lg border text-center transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                              isSel
                                ? 'bg-primary border-primary text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50/50 hover:border-gray-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transition buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 h-12 rounded-button border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 hover:border-gray-300 text-xs font-bold transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                Kembali
              </button>
              <button
                onClick={handleNextToRedFlags}
                disabled={!!tempError}
                className={`flex-1 h-12 rounded-button text-xs font-bold transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  !tempError
                    ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/10 active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                <span>Cek Tanda Bahaya</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: RED FLAGS SCREEN ================= */}
      {step === 3 && (
        <div className="space-y-5">
          
          {/* Important guidance box */}
          <div className="bg-rose-50/60 border border-rose-100 rounded-card p-4 space-y-1.5 text-xs text-rose-950 leading-relaxed shadow-sm">
            <span className="font-extrabold text-rose-800 text-[11px] uppercase tracking-wider block">🚨 Screening Tanda Bahaya Kritis (Red Flags)</span>
            <p className="font-medium text-rose-900">
              Silakan baca tanda bahaya darurat medis di bawah secara cermat untuk keselamatan si kecil.
            </p>
          </div>

          <div className="bg-white rounded-card border border-gray-100 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold font-[var(--font-heading)] text-gray-900">
                Pilih Tanda Bahaya Yang Muncul
              </h3>
              <p className="text-xs text-gray-500">
                Centang kondisi darurat berikut jika dialami si kecil saat ini:
              </p>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-2.5">
              {RED_FLAGS_OPTIONS.map((flag, idx) => {
                const isChecked = selectedRedFlags.includes(flag);
                return (
                  <button
                    key={`rf-${idx}`}
                    onClick={() => handleRedFlagChange(flag)}
                    className={`w-full flex gap-3.5 items-start p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ease-in-out select-none active:scale-[0.99] ${
                      isChecked
                        ? 'border-danger bg-danger/[0.02] shadow-sm'
                        : 'border-gray-200 bg-white hover:bg-gray-50/50 hover:border-gray-300'
                    }`}
                  >
                    <div className={`mt-0.5 w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isChecked 
                        ? 'bg-danger border-danger text-white' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      {isChecked && (
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 leading-snug">{flag}</span>
                  </button>
                );
              })}

              <hr className="border-gray-100 my-3" />

              {/* Exclusive Checkbox option */}
              <button
                onClick={handleNoRedFlagsChange}
                className={`w-full flex gap-3.5 items-center p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ease-in-out select-none min-h-[50px] active:scale-[0.99] ${
                  hasNoRedFlags
                    ? 'border-accent bg-accent/[0.02] shadow-sm'
                    : 'border-gray-200 bg-white hover:bg-gray-50/50 hover:border-gray-300'
                }`}
              >
                <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  hasNoRedFlags 
                    ? 'bg-accent border-accent text-white' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {hasNoRedFlags && (
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  )}
                </div>
                <span className="text-xs font-extrabold text-accent">
                  🟢 Tidak ada tanda bahaya di atas (Kondisi Stabil)
                </span>
              </button>
            </div>

            {/* Validation warning */}
            {selectedRedFlags.length === 0 && !hasNoRedFlags && (
              <p className="text-[11px] text-danger font-semibold bg-danger/5 p-2.5 rounded-lg border border-danger/10 text-center">
                ⚠️ Bunda, mohon centang salah satu tanda bahaya di atas atau centang opsi "Tidak ada tanda bahaya di atas" untuk melihat hasil.
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 h-12 rounded-button border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 hover:border-gray-300 text-xs font-bold transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                Kembali
              </button>
              <button
                onClick={handleSubmitAssessment}
                disabled={selectedRedFlags.length === 0 && !hasNoRedFlags}
                className={`flex-1 h-12 rounded-button text-xs font-bold transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  (selectedRedFlags.length > 0 || hasNoRedFlags)
                    ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/10 active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                <span>Lihat Hasil Skrining</span>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 4: SCREENING RESULTS SCREEN ================= */}
      {step === 4 && assessmentResult && (
        <div className="space-y-6">
          
          {/* Main Urgency status card */}
          {(() => {
            const cfg = getUrgencyConfig(assessmentResult.urgencyLevel);
            return (
              <div className={`rounded-card p-5 border shadow-sm space-y-3 flex flex-col items-center text-center ${
                assessmentResult.urgencyLevel === 'emergency'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : assessmentResult.urgencyLevel === 'doctor'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-green-50 border-green-200 text-green-700'
              }`}>
                <span className="text-4xl">{cfg.icon}</span>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">Tingkat Urgensi</span>
                  <h3 className="text-sm font-black font-[var(--font-heading)] uppercase tracking-wide">
                    {cfg.label}
                  </h3>
                </div>
                <p className="text-xs font-semibold leading-relaxed max-w-[320px] opacity-95">
                  {cfg.desc}
                </p>
              </div>
            );
          })()}

          {/* Diagnosis & Master description details */}
          <div className="bg-white rounded-card border border-gray-100 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-4 hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out">
            <div className="border-b border-gray-100 pb-3">
              <span className="text-[9px] text-primary font-bold uppercase tracking-wider font-[var(--font-heading)]">Hasil Kecocokan Gejala</span>
              <h3 className="text-base font-extrabold font-[var(--font-heading)] text-gray-900 leading-tight mt-0.5">
                {assessmentResult.results.diseaseName}
              </h3>
              {assessmentResult.results.medicalName && (
                <p className="text-xs text-gray-500 italic mt-0.5">({assessmentResult.results.medicalName})</p>
              )}
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1 leading-relaxed">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tentang Penyakit:</span>
                <p className="text-gray-600 font-medium leading-relaxed">{assessmentResult.results.description}</p>
              </div>

              {/* Home remedies / First aid guide */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">🚨 Panduan Pertolongan Pertama (Home Remedies):</span>
                <div className="bg-gray-50/60 rounded-xl p-4 border border-gray-100 text-gray-600 font-medium leading-relaxed whitespace-normal break-words space-y-2">
                  {assessmentResult.results.homeRemedies.split('. ').map((item, idx) => {
                    if (!item.trim()) return null;
                    return (
                      <p key={`rem-${idx}`} className="flex gap-2">
                        <span className="text-primary font-bold shrink-0">{idx + 1}.</span>
                        <span className="leading-relaxed">{item.trim().endsWith('.') ? item.trim() : `${item.trim()}.`}</span>
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Warning signs checklist */}
              {assessmentResult.results.warningSigns && assessmentResult.results.warningSigns.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-[10px] text-danger font-bold uppercase tracking-wider block">⚠️ Tanda Bahaya Spesifik Yang Harus Diawasi:</span>
                  <div className="space-y-1.5 pl-0.5">
                    {assessmentResult.results.warningSigns.map((sign, idx) => (
                      <div key={`ws-${idx}`} className="flex gap-2.5 items-start text-rose-950 font-medium">
                        <span className="text-danger shrink-0 text-sm mt-[-2px]">•</span>
                        <p className="text-[11px] leading-relaxed text-rose-900">{sign}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Articles list */}
          {assessmentResult.relatedArticlesFull && assessmentResult.relatedArticlesFull.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider pl-1 block">
                📚 Artikel Edukasi Terkait Gejala
              </span>
              
              <div className="grid grid-cols-1 gap-3">
                {assessmentResult.relatedArticlesFull.map((art) => {
                  const bookmarked = isArticleBookmarked(art.id);
                  return (
                    <div
                      key={art.id}
                      className="bg-white rounded-xl border border-gray-100 p-4 flex justify-between items-start gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.01)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.03)] hover:border-gray-200 transition-all duration-200 ease-in-out"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase rounded-full bg-secondary/15 text-secondary border border-secondary/10">
                          {art.category === 'gizi' ? 'Nutrisi & MPASI' : art.category === 'menyusui' ? 'Menyusui' : 'Tumbuh Kembang'}
                        </span>
                        <h4 className="text-xs font-bold text-gray-900 leading-snug mt-1.5 whitespace-normal break-words">
                          {art.title}
                        </h4>
                      </div>

                      {/* Bookmark button */}
                      <button
                        onClick={(e) => handleBookmarkToggle(e, art.id)}
                        className="p-1 text-gray-400 hover:text-primary transition-all active:scale-90 focus:outline-none cursor-pointer shrink-0"
                        aria-label="Simpan artikel"
                      >
                        <svg
                          className={`w-5 h-5 ${
                            bookmarked ? 'fill-primary text-primary' : 'fill-transparent text-gray-400'
                          }`}
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Premium Highly Visible Medical Disclaimer at bottom */}
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-card space-y-1.5 text-center shadow-sm">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block">⚠️ Disclaimer Medis</span>
            <p className="text-[11px] font-semibold text-gray-600 leading-relaxed max-w-[340px] mx-auto">
              Aplikasi ini adalah panduan pertolongan pertama mandiri dan bukan pengganti diagnosis dokter medis profesional.
            </p>
          </div>

          {/* Print/Share and Save & Return Action buttons */}
          <div className="space-y-2.5 pt-2">
            <div className="flex gap-3">
              <button
                onClick={handleShareResult}
                className="flex-1 h-12 rounded-button border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 hover:border-gray-300 text-xs font-bold transition-all duration-200 ease-in-out active:scale-[0.98] focus:outline-none cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186l.957-.478a2.25 2.25 0 103.77-1.908l-1.514-.757m-3.213 3.143l1.51 3.021a2.25 2.25 0 103.93-1.094l-1.51-3.02" />
                </svg>
                <span>Bagikan Hasil</span>
              </button>
              
              <button
                onClick={onBack}
                className="flex-1 h-12 rounded-button bg-primary hover:bg-primary-dark active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-primary/10 transition-all duration-200 ease-in-out focus:outline-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 10.707a1 1 0 01-1.414 0L10 10.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 9 6.293 6.707a1 1 0 011.414-1.414L10 7.586l2.293-2.293a1 1 0 011.414 1.414L11.414 9l2.293 2.293a1 1 0 010 1.414z" />
                </svg>
                <span>Simpan & Selesai</span>
              </button>
            </div>

            <button
              onClick={handleResetCheck}
              className="w-full h-11 rounded-button text-xs text-primary font-bold hover:bg-primary/5 transition-all duration-200 active:scale-[0.98] cursor-pointer block border border-primary/20"
            >
              Ulangi Skrining Gejala Baru
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
