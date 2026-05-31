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

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    } catch (e) {
      return '';
    }
  };

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
      
      {/* CAKUPAN IMUNISASI SECTION - PLAIN CONTENT STYLE */}
      <div className="space-y-4 animate-fade-in p-0">
        <div className="border-b border-gray-200/60 pb-3 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-widest font-black bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
              Cakupan Imunisasi
            </span>
            <h3 className="text-lg font-black font-[var(--font-heading)] leading-none mt-1 text-gray-900">
              {progress}% Selesai
            </h3>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0 text-primary">
            <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          {/* Status Specs Grid matching MPASI texture/frequency grid */}
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col justify-between hover:border-primary/20 transition-colors">
              <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Status Imunisasi</span>
              <p className="text-gray-900 font-extrabold text-xs mt-1 leading-tight">{completedVaccines.length} Vaksin Selesai</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col justify-between hover:border-primary/20 transition-colors">
              <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Sisa Jadwal</span>
              <p className="text-gray-900 font-extrabold text-xs mt-1 leading-tight">{scheduledVaccines.length} Vaksin Terjadwal</p>
            </div>
          </div>

          <hr className="border-gray-200/60" />

          {/* Progress Bar directly on background */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              <span>Kemajuan Vaksinasi {activeChild.name}</span>
              <span className="text-primary font-black">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 border border-gray-200/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Berdasarkan anjuran medis IDAI dan Kementerian Kesehatan RI untuk {ageString} ({activeChild.name}).
            </p>
          </div>
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

                  {/* Vaccine Cards under this milestone (Timeline Style) */}
                  {!isCollapsed && (
                    <div className="relative pl-1.5 space-y-4 animate-slide-down">
                      {group.items.map((item) => (
                        <div 
                          key={item.id}
                          className="relative flex gap-1.5 items-stretch min-h-[70px]"
                        >
                          {/* Left Column: Recommended Age & Target Date */}
                          <div className="w-14 shrink-0 flex flex-col justify-center text-right pr-2 select-none">
                            <span className="text-[11px] font-black text-gray-900 leading-tight">
                              {item.vaccine?.recommendedAgeMonths === 0 ? "Lahir" : `${item.vaccine?.recommendedAgeMonths} Bln`}
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold mt-0.5 leading-none">
                              {formatDateShort(item.scheduledDate)}
                            </span>
                          </div>

                          {/* Timeline node line & dot */}
                          <div className="relative w-6 shrink-0 flex items-center justify-center">
                            {/* Line */}
                            <div className="absolute top-0 bottom-0 w-0 border-l border-dashed border-gray-200" />
                            {/* Circular Checkbox Node */}
                            <div className="relative z-10 bg-white rounded-full p-0.5">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(item)}
                                className={`w-5.5 h-5.5 rounded-full border-2 bg-white transition-all duration-200 flex items-center justify-center cursor-pointer hover:scale-105 group/btn ${
                                  item.isLate
                                    ? 'border-danger/35 hover:border-danger hover:bg-danger/5 text-danger/30 hover:text-danger'
                                    : 'border-gray-200 hover:border-primary hover:bg-primary/5 text-gray-300 hover:text-primary'
                                }`}
                                aria-label={`Tandai ${item.vaccine?.name || 'Vaksin'} selesai`}
                              >
                                <svg className="w-3 h-3 stroke-current transition-colors duration-200" fill="none" viewBox="0 0 24 24" strokeWidth="3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Right Column: Premium Card Content */}
                          <div 
                            className={`flex-1 bg-white rounded-card border p-3.5 space-y-1.5 transition-all duration-200 hover:shadow-sm ${
                              item.isLate 
                                ? 'border-danger/25 bg-danger/[0.01]' 
                                : 'border-gray-100 hover:border-primary/20'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <h4 className="text-xs font-black font-[var(--font-heading)] text-gray-900 leading-tight">
                                {item.vaccine?.name} {item.vaccine?.doseNumber > 1 && `(Dosis ${item.vaccine?.doseNumber})`}
                              </h4>
                              {item.isLate && (
                                <span className="px-1.5 py-0.5 text-[8px] font-black bg-danger/10 text-danger rounded-md uppercase tracking-wider">
                                  Terlambat
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                              {item.vaccine?.description}
                            </p>
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

                  {/* Completed Vaccine Cards (Timeline Style) */}
                  {!isCollapsed && (
                    <div className="relative pl-1.5 space-y-4 animate-slide-down">
                      {group.items.map((item) => {
                        const isExpanded = !!expandedVaccineIds[item.id];
                        return (
                          <div 
                            key={item.id}
                            className="relative flex gap-1.5 items-stretch min-h-[70px]"
                          >
                            {/* Left Column: Recommended Age & Target Date */}
                            <div className="w-14 shrink-0 flex flex-col justify-center text-right pr-2 select-none">
                              <span className="text-[11px] font-black text-gray-900 leading-tight">
                                {item.vaccine?.recommendedAgeMonths === 0 ? "Lahir" : `${item.vaccine?.recommendedAgeMonths} Bln`}
                              </span>
                              <span className="text-[9px] text-gray-400 font-bold mt-0.5 leading-none">
                                {formatDateShort(item.actualDate)}
                              </span>
                            </div>

                            {/* Timeline node line & dot */}
                            <div className="relative w-6 shrink-0 flex items-center justify-center">
                              {/* Line */}
                              <div className="absolute top-0 bottom-0 w-0 border-l border-solid border-primary/25" />
                              {/* Circular Checkbox Node */}
                              <div className="relative z-10 bg-white rounded-full p-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Avoid triggering card expansion
                                    handleToggleStatus(item);
                                  }}
                                  className="w-5.5 h-5.5 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105 hover:bg-danger hover:border-danger hover:text-white"
                                  aria-label={`Batalkan centang ${item.vaccine?.name || 'Vaksin'}`}
                                  title="Klik untuk membatalkan"
                                >
                                  <svg className="w-3 h-3 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Completed Card */}
                            <div 
                              className="flex-1 bg-white rounded-card border border-gray-100 hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-200 ease-in-out overflow-hidden"
                            >
                              <div 
                                className="p-3.5 flex gap-3.5 items-start cursor-pointer select-none"
                                onClick={() => toggleExpanded(item.id)}
                              >
                                {/* Vaccine Info Header */}
                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <h4 className="text-xs font-black font-[var(--font-heading)] text-gray-900 leading-tight">
                                      {item.vaccine?.name} {item.vaccine?.doseNumber > 1 && `(Dosis ${item.vaccine?.doseNumber})`}
                                    </h4>
                                  </div>
                                  
                                  <div className="flex items-center justify-between text-[9px] text-gray-500 pt-0.5">
                                    <span>Diberikan Pada:</span>
                                    <span className="font-bold text-primary">
                                      {formatDate(item.actualDate)}
                                    </span>
                                  </div>
                                </div>

                                {/* Expand icon arrow */}
                                <div className="shrink-0 pt-0.5 text-gray-400">
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
                                <div className="px-3.5 pb-3.5 pt-2 bg-gray-50/40 border-t border-gray-100 text-[10px] space-y-2.5 animate-slide-down">
                                  {item.vaccine?.description && (
                                    <div className="space-y-0.5">
                                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Deskripsi Vaksin</span>
                                      <p className="text-gray-500 font-medium leading-relaxed">{item.vaccine?.description}</p>
                                    </div>
                                  )}
                                  
                                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100/60">
                                    <div>
                                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Tempat/Lokasi</span>
                                      <p className="text-gray-900 font-semibold mt-0.5">{item.location || '-'}</p>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Tenaga Medis</span>
                                      <p className="text-gray-900 font-semibold mt-0.5">{item.healthcareWorker || '-'}</p>
                                    </div>
                                  </div>

                                  {item.sideEffectsNoted && (
                                    <div className="pt-2 border-t border-gray-100/60 space-y-0.5">
                                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Efek Samping (KIPI)</span>
                                      <p className="text-gray-600 font-medium leading-relaxed bg-warning/5 border border-warning/10 p-2 rounded-lg">
                                        {item.sideEffectsNoted}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
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
