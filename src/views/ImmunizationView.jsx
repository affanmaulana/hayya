import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChild } from '../hooks/useChild';
import { useImmunization } from '../hooks/useImmunization';
import { calculateAgeInMonthsAndDays, formatDate } from '../utils/dateHelpers';
import CustomDatePicker from '../components/CustomDatePicker.jsx';

export default function ImmunizationView() {
  const navigate = useNavigate();
  const { activeChild, loading } = useChild();

  if (!activeChild) return null;
  
  // Consume hook with reactive activeChild ID
  const { 
    calendar, 
    progress, 
    loading: immunizationLoading, 
    error, 
    updateImmunizationRecord 
  } = useImmunization(activeChild?.id);

  // Local state for modal logging
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [actualDate, setActualDate] = useState('');
  const [location, setLocation] = useState('');
  const [healthcareWorker, setHealthcareWorker] = useState('');
  const [sideEffects, setSideEffects] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local state for undo confirmation modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [vaccineToUncheck, setVaccineToUncheck] = useState(null);

  // Collapsible age milestone states (stored as [ageMonths]: boolean, true means collapsed)
  const [collapsedScheduledAges, setCollapsedScheduledAges] = useState({});
  const [collapsedCompletedAges, setCollapsedCompletedAges] = useState({});

  // Local state to track which completed vaccines are expanded to show details
  const [expandedVaccineIds, setExpandedVaccineIds] = useState({});

  // Reset modal and expanded states when child changes by adjusting state during render
  // This complies with standard React patterns and avoids cascading useEffect render lint errors.
  const [prevChildId, setPrevChildId] = useState(activeChild?.id || '');
  if (activeChild?.id !== prevChildId) {
    setPrevChildId(activeChild?.id || '');
    setIsModalOpen(false);
    setIsConfirmOpen(false);
    setSelectedVaccine(null);
    setVaccineToUncheck(null);
    setExpandedVaccineIds({});
    setCollapsedScheduledAges({});
    setCollapsedCompletedAges({});
  }

  // Calculate age string for active child
  const ageString = useMemo(() => {
    if (!activeChild || !activeChild.dateOfBirth) return '';
    const { months, days } = calculateAgeInMonthsAndDays(activeChild.dateOfBirth);
    
    if (months === 0 && days === 0) return 'Baru lahir';
    
    const monthText = months > 0 ? `${months} Bulan` : '';
    const dayText = days > 0 ? `${days} Hari` : '';
    
    return [monthText, dayText].filter(Boolean).join(' ');
  }, [activeChild]);

  // Split calendar into Scheduled (Upcoming) and Completed (Done)
  const scheduledVaccines = useMemo(() => {
    return calendar.filter(item => item.status !== 'done');
  }, [calendar]);

  const completedVaccines = useMemo(() => {
    return calendar.filter(item => item.status === 'done');
  }, [calendar]);

  // Group vaccines by recommended age milestone helper
  const groupVaccinesByAge = (vaccinesList) => {
    const groups = {};
    vaccinesList.forEach(item => {
      const age = item.vaccine?.recommendedAgeMonths ?? 0;
      if (!groups[age]) {
        groups[age] = [];
      }
      groups[age].push(item);
    });

    return Object.keys(groups)
      .sort((a, b) => Number(a) - Number(b))
      .map(age => ({
        ageMonths: Number(age),
        label: Number(age) === 0 ? 'Lahir / 0 Bulan' : `Usia ${age} Bulan`,
        items: groups[age]
      }));
  };

  // Grouped datasets
  const groupedScheduled = useMemo(() => {
    return groupVaccinesByAge(scheduledVaccines);
  }, [scheduledVaccines]);

  const groupedCompleted = useMemo(() => {
    return groupVaccinesByAge(completedVaccines);
  }, [completedVaccines]);

  // Toggle age milestone collapse states
  const toggleScheduledAgeCollapse = (ageMonths) => {
    setCollapsedScheduledAges(prev => ({
      ...prev,
      [ageMonths]: !prev[ageMonths]
    }));
  };

  const toggleCompletedAgeCollapse = (ageMonths) => {
    setCollapsedCompletedAges(prev => ({
      ...prev,
      [ageMonths]: !prev[ageMonths]
    }));
  };

  // Toggle immunization status
  const handleToggleStatus = async (item) => {
    if (item.status === 'done') {
      // Open undo confirmation dialog
      setVaccineToUncheck(item);
      setIsConfirmOpen(true);
    } else {
      // Open modal to log completion details
      setSelectedVaccine(item);
      setActualDate(new Date().toISOString().split('T')[0]); // Default to today
      setLocation('');
      setHealthcareWorker('');
      setSideEffects('');
      setModalError('');
      setIsModalOpen(true);
    }
  };

  // Confirm undo completion
  const handleConfirmUncheck = async () => {
    if (!vaccineToUncheck) return;
    try {
      await updateImmunizationRecord(activeChild.id, vaccineToUncheck.vaccineId, 'scheduled');
      
      // Close expander if open
      setExpandedVaccineIds(prev => ({
        ...prev,
        [vaccineToUncheck.id]: false
      }));

      setIsConfirmOpen(false);
      setVaccineToUncheck(null);
    } catch (err) {
      console.error('Error reverting immunization record:', err);
    }
  };

  // Submit completion details
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      if (!actualDate) {
        throw new Error('Tanggal pemberian wajib diisi, Bunda. 🧡');
      }

      await updateImmunizationRecord(
        activeChild.id,
        selectedVaccine.vaccineId,
        'done',
        actualDate,
        location,
        healthcareWorker,
        sideEffects
      );

      // Close modal
      setIsModalOpen(false);
      setSelectedVaccine(null);
    } catch (err) {
      setModalError(err.message || 'Gagal menyimpan catatan imunisasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle card expansion (to view saved details)
  const toggleExpanded = (recordId) => {
    setExpandedVaccineIds(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };



  return (
    <div className="space-y-6 font-[var(--font-body)] px-0 animate-fade-in relative">
      
      {/* HEADER SECTION - Child Profile Summary */}
      <div className="bg-white rounded-card border border-gray-100 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border ${
          activeChild.gender === 'L'
            ? 'bg-accent/10 border-accent/15 text-accent'
            : 'bg-primary/10 border-primary/15 text-primary'
        }`}>
          {activeChild.name ? activeChild.name.charAt(0).toUpperCase() : '👶'}
        </div>
        <div>
          <h2 className="text-base font-extrabold font-[var(--font-heading)] text-gray-900 leading-tight">
            Jadwal Imunisasi {activeChild.name}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Lahir: {formatDate(activeChild.dateOfBirth)} • <span className="font-semibold text-primary">{ageString}</span>
          </p>
        </div>
      </div>

      {/* PROGRESS TRACKER */}
      <div className="bg-white rounded-card border border-gray-100 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-700 font-semibold">Cakupan Imunisasi</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Berdasarkan vaksinasi yang selesai</span>
          </div>
          <span className="text-lg font-black text-accent font-[var(--font-heading)]">
            {progress}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-50 border border-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* SECTION 1: BELUM IMUNISASI (Scheduled/Upcoming) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h3 className="text-sm font-extrabold font-[var(--font-heading)] text-gray-900 flex items-center gap-2">
            🛡️ Belum Imunisasi
            <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-50 border border-gray-100 rounded-full text-gray-500">
              {scheduledVaccines.length}
            </span>
          </h3>
        </div>

        {immunizationLoading ? (
          <div className="py-6 text-center text-sm text-gray-500">Memuat data jadwal imunisasi...</div>
        ) : error ? (
          <div className="p-3 bg-danger/5 border border-danger/10 text-danger text-xs rounded-input">{error}</div>
        ) : scheduledVaccines.length === 0 ? (
          <div className="p-6 bg-white border border-gray-100 rounded-card text-center text-xs text-gray-400 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            Semua imunisasi anjuran saat ini sudah selesai dicatat! Hebat, Bunda! 🎉
          </div>
        ) : (
          <div className="space-y-4">
            {groupedScheduled.map((group) => {
              const isCollapsed = !!collapsedScheduledAges[group.ageMonths];
              return (
                <div key={`sched-group-${group.ageMonths}`} className="space-y-2.5">
                  
                  {/* Expandable Age Header */}
                  <button
                    type="button"
                    onClick={() => toggleScheduledAgeCollapse(group.ageMonths)}
                    className="w-full flex items-center justify-between py-2 px-1 cursor-pointer select-none group border-b border-gray-100/80 focus:outline-none"
                    aria-label={`Toggle grup usia ${group.label}`}
                  >
                    <span className="text-xs font-bold text-gray-700 font-[var(--font-heading)] group-hover:text-primary transition-colors flex items-center gap-2">
                      <span>👶 {group.label}</span>
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-gray-50 border border-gray-100 rounded-full text-gray-400">
                        {group.items.length}
                      </span>
                    </span>
                    <svg 
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Vaccine Cards under this milestone */}
                  {!isCollapsed && (
                    <div className="space-y-3 pl-1.5 animate-slide-down">
                      {group.items.map((item) => (
                        <div 
                          key={item.id}
                          className={`bg-white rounded-card border transition-all duration-200 ease-in-out p-4 flex gap-3.5 items-start ${
                            item.isLate 
                              ? 'border-danger/25 bg-danger/[0.01] shadow-[0_4px_12px_rgba(0,0,0,0.02)]' 
                              : 'border-gray-100 hover:border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)]'
                          }`}
                        >
                          {/* Minimalist custom interactive checkbox toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(item)}
                            className={`w-6 h-6 shrink-0 rounded-full border-2 transition-all duration-200 ease-in-out flex items-center justify-center cursor-pointer focus:outline-none ${
                              item.isLate
                                ? 'border-danger/30 hover:border-danger hover:bg-danger/5'
                                : 'border-gray-200 hover:border-primary hover:bg-primary/5 hover:scale-105 active:scale-95'
                            }`}
                            aria-label={`Tandai ${item.vaccine?.name || 'Vaksin'} selesai`}
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-transparent" />
                          </button>

                          {/* Vaccine Details Info */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h4 className="text-sm font-semibold font-[var(--font-heading)] text-gray-900 truncate">
                                {item.vaccine?.name} {item.vaccine?.doseNumber > 1 && `(Dosis ${item.vaccine?.doseNumber})`}
                              </h4>
                              
                              {/* Dynamic Status Badge */}
                              {item.isLate && (
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-danger/10 border border-danger/15 text-danger rounded-full uppercase tracking-wider">
                                  Terlambat
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-gray-500 leading-relaxed">
                              {item.vaccine?.description}
                            </p>

                            <div className="pt-1 flex items-center justify-between text-[11px] text-gray-400">
                              <span>Target Tanggal:</span>
                              <span className={`font-semibold ${item.isLate ? 'text-danger' : 'text-gray-500'}`}>
                                {formatDate(item.scheduledDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: SUDAH IMUNISASI (Completed) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h3 className="text-sm font-extrabold font-[var(--font-heading)] text-gray-900 flex items-center gap-2">
            ✅ Sudah Imunisasi
            <span className="px-2 py-0.5 text-[10px] font-bold bg-accent/5 border border-accent/15 rounded-full text-accent">
              {completedVaccines.length}
            </span>
          </h3>
        </div>

        {completedVaccines.length === 0 ? (
          <div className="p-6 bg-white border border-gray-100 rounded-card text-center text-xs text-gray-400 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            Belum ada imunisasi yang dicatat selesai. Bunda bisa mencentang imunisasi di atas jika sudah dilaksanakan.
          </div>
        ) : (
          <div className="space-y-4">
            {groupedCompleted.map((group) => {
              const isCollapsed = !!collapsedCompletedAges[group.ageMonths];
              return (
                <div key={`comp-group-${group.ageMonths}`} className="space-y-2.5">
                  
                  {/* Expandable Completed Age Header */}
                  <button
                    type="button"
                    onClick={() => toggleCompletedAgeCollapse(group.ageMonths)}
                    className="w-full flex items-center justify-between py-2 px-1 cursor-pointer select-none group border-b border-gray-100/80 focus:outline-none"
                    aria-label={`Toggle grup selesai usia ${group.label}`}
                  >
                    <span className="text-xs font-bold text-gray-700 font-[var(--font-heading)] group-hover:text-primary transition-colors flex items-center gap-2">
                      <span>👶 {group.label}</span>
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-accent/5 border border-accent/10 rounded-full text-accent">
                        {group.items.length}
                      </span>
                    </span>
                    <svg 
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Completed Vaccine Cards */}
                  {!isCollapsed && (
                    <div className="space-y-3 pl-1.5 animate-slide-down">
                      {group.items.map((item) => {
                        const isExpanded = !!expandedVaccineIds[item.id];
                        return (
                          <div 
                            key={item.id}
                            className="bg-white rounded-card border border-gray-100 hover:border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out overflow-hidden"
                          >
                            <div 
                              className="p-4 flex gap-3.5 items-start cursor-pointer select-none"
                              onClick={() => toggleExpanded(item.id)}
                            >
                              {/* Active completed checkbox */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation(); // Avoid triggering card expansion
                                  handleToggleStatus(item);
                                }}
                                className="w-6 h-6 shrink-0 rounded-full border-2 border-accent bg-accent/5 flex items-center justify-center cursor-pointer focus:outline-none hover:border-danger hover:bg-danger/5 transition-all duration-200 ease-in-out text-accent hover:text-danger group"
                                aria-label={`Batalkan centang ${item.vaccine?.name || 'Vaksin'}`}
                                title="Klik untuk membatalkan"
                              >
                                <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>

                              {/* Vaccine Info Header */}
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                                    {item.vaccine?.name} {item.vaccine?.doseNumber > 1 && `(Dosis ${item.vaccine?.doseNumber})`}
                                  </h4>
                                </div>
                                
                                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                                  <span>Diberikan Pada:</span>
                                  <span className="font-bold text-accent">
                                    {formatDate(item.actualDate)}
                                  </span>
                                </div>
                              </div>

                              {/* Expand icon arrow */}
                              <div className="shrink-0 pt-1.5 pl-1 text-gray-400">
                                <svg 
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2.5" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>

                            {/* Expandable record details */}
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-2 bg-gray-50/40 border-t border-gray-100 text-xs space-y-2.5 animate-slide-down">
                                {item.vaccine?.description && (
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Deskripsi Vaksin</span>
                                    <p className="text-gray-500 font-medium leading-relaxed">{item.vaccine?.description}</p>
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100/60">
                                  <div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tempat/Lokasi</span>
                                    <p className="text-gray-900 font-semibold mt-0.5">{item.location || '-'}</p>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tenaga Medis</span>
                                    <p className="text-gray-900 font-semibold mt-0.5">{item.healthcareWorker || '-'}</p>
                                  </div>
                                </div>

                                {item.sideEffectsNoted && (
                                  <div className="pt-2 border-t border-gray-100/60 space-y-0.5">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Efek Samping (KIPI)</span>
                                    <p className="text-gray-600 font-medium leading-relaxed bg-warning/5 border border-warning/10 p-2.5 rounded-lg">
                                      {item.sideEffectsNoted}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== DIALOG MODAL FOR LOGGING COMPLETION ===== */}
      {isModalOpen && selectedVaccine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          />

          <div className="bg-white rounded-card border border-gray-100 w-full max-w-[360px] shadow-2xl relative z-10 overflow-hidden font-[var(--font-body)] animate-scale-up">
            <div className="bg-primary/[0.02] border-b border-gray-100 px-5 py-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Catat Imunisasi</span>
                <h3 className="text-sm font-extrabold font-[var(--font-heading)] text-gray-900 mt-0.5">
                  {selectedVaccine.vaccine?.name}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50/60 transition-all duration-200 cursor-pointer font-bold text-base focus:outline-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 bg-danger/5 border border-danger/10 text-danger text-xs font-semibold rounded-input leading-relaxed animate-shake">
                  {modalError}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="modal-date" className="text-xs font-bold text-gray-700 flex items-center justify-between">
                  <span>Tanggal Pemberian *</span>
                  <span className="text-[10px] text-gray-400 font-normal">Sesuai kartu</span>
                </label>
                <CustomDatePicker
                  id="modal-date"
                  value={actualDate}
                  onChange={(e) => setActualDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min={activeChild?.dateOfBirth}
                  placeholder="Pilih tanggal pemberian..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modal-location" className="text-xs font-bold text-gray-700">
                  Lokasi Imunisasi
                </label>
                <input
                  id="modal-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Misal: Posyandu Dahlia, Puskesmas"
                  className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modal-nakes" className="text-xs font-bold text-gray-700">
                  Tenaga Medis / Bidan
                </label>
                <input
                  id="modal-nakes"
                  type="text"
                  value={healthcareWorker}
                  onChange={(e) => setHealthcareWorker(e.target.value)}
                  placeholder="Misal: Bidan Susi"
                  className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modal-kipi" className="text-xs font-bold text-gray-700">
                  Efek Samping (KIPI)
                </label>
                <textarea
                  id="modal-kipi"
                  value={sideEffects}
                  onChange={(e) => setSideEffects(e.target.value)}
                  placeholder="Misal: Badan agak demam hangat di malam hari"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 border border-gray-200 rounded-button text-xs font-semibold text-gray-500 hover:bg-gray-50/40 cursor-pointer focus:outline-none transition-all duration-200 ease-in-out"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 rounded-button bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-md shadow-primary/10 cursor-pointer focus:outline-none transition-all duration-200 ease-in-out flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== CONFIRMATION MODAL FOR UNDOING COMPLETION ===== */}
      {isConfirmOpen && vaccineToUncheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsConfirmOpen(false)}
          />

          <div className="bg-white rounded-card border border-gray-100 w-full max-w-[340px] shadow-2xl relative z-10 overflow-hidden font-[var(--font-body)] animate-scale-up">
            <div className="p-6 text-center space-y-4">
              {/* Question Icon */}
              <div className="w-14 h-14 bg-warning/10 border border-warning/15 rounded-full flex items-center justify-center text-warning text-2xl mx-auto">
                ⚠️
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold font-[var(--font-heading)] text-gray-900 leading-tight">
                  Batalkan Riwayat Vaksin?
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Apakah Bunda yakin ingin mengubah status vaksin <span className="font-bold text-gray-700">{vaccineToUncheck.vaccine?.name}</span> ini kembali menjadi belum selesai? 🧡
                </p>
              </div>

              {/* Action buttons matching design tokens */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmOpen(false);
                    setVaccineToUncheck(null);
                  }}
                  className="flex-1 h-11 border border-gray-200 rounded-button text-xs font-semibold text-gray-500 hover:bg-gray-50/40 cursor-pointer focus:outline-none transition-all duration-200 ease-in-out"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUncheck}
                  className="flex-1 h-11 rounded-button bg-danger hover:bg-danger-dark text-white text-xs font-bold shadow-md shadow-danger/10 cursor-pointer focus:outline-none transition-all duration-200 ease-in-out"
                >
                  Ya, Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
