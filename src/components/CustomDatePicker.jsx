import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * CustomDatePicker - A gorgeous React calendar input field.
 * Fixed centered modal calendar popup with React Portal:
 * - Single popup modal structure using React Portal.
 * - content switches dynamically inside the same popup:
 *   - Default: date grid (days).
 *   - Tap Month Year header -> replaces with Month grid.
 *   - Tap Year header inside Month grid -> replaces with Year grid.
 *   - Tap Year selects year -> returns to Month grid.
 *   - Tap Month selects month -> returns to Days grid.
 * - No quick select buttons (Hari Ini, Kemarin, 1 Minggu Lalu).
 * - No down arrows.
 * - High-fidelity while-press active touch styles.
 */
export default function CustomDatePicker({
  value,
  onChange,
  min,
  max,
  required = false,
  className = '',
  id,
  placeholder = 'Pilih tanggal...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value || '');
  const [pickerView, setPickerView] = useState('days'); // 'days' | 'months' | 'years'
  const containerRef = useRef(null);

  // Toggle picker modal
  const toggleOpen = () => {
    if (!isOpen) {
      setTempDate(value || '');
      setPickerView('days');
    }
    setIsOpen(!isOpen);
  };

  // Parse target date (YYYY-MM-DD) safely
  const parsedTempDate = React.useMemo(() => {
    const target = tempDate || value;
    if (!target) return null;
    const parts = target.split('-');
    if (parts.length !== 3) return null;
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10) - 1, // 0-indexed
      day: parseInt(parts[2], 10)
    };
  }, [tempDate, value]);

  // Calendar navigation state (defaults to selected temp date or today)
  const [navYear, setNavYear] = useState(() => parsedTempDate?.year || new Date().getFullYear());
  const [navMonth, setNavMonth] = useState(() => parsedTempDate?.month !== undefined ? parsedTempDate.month : new Date().getMonth());

  // Keep navigation in sync with updates
  useEffect(() => {
    if (parsedTempDate) {
      setNavYear(parsedTempDate.year);
      setNavMonth(parsedTempDate.month);
    }
  }, [parsedTempDate]);

  // Format date helper (e.g. "31 Mei 2026")
  const formattedDisplayValue = React.useMemo(() => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length !== 3) return '';
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const monthsName = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d} ${monthsName[m]} ${y}`;
  }, [value]);

  // Handle day selection
  const selectDay = (day, monthOffset = 0) => {
    let targetMonth = navMonth + monthOffset;
    let targetYear = navYear;
    
    if (targetMonth < 0) {
      targetMonth = 11;
      targetYear -= 1;
    } else if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }

    const formattedMonth = String(targetMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const itemValue = `${targetYear}-${formattedMonth}-${formattedDay}`;
    
    // Check constraints
    if (min && itemValue < min) return;
    if (max && itemValue > max) return;

    setTempDate(itemValue);
  };

  // Confirm selection (Enter/Pilih)
  const handleConfirm = () => {
    if (tempDate) {
      onChange({ target: { value: tempDate } });
    }
    setIsOpen(false);
  };

  // Cancel selection
  const handleCancel = () => {
    setTempDate(value || '');
    setIsOpen(false);
  };

  // Year range start for the 'years' view grid (centers around current navYear)
  const startYear = navYear - 5;
  const yearsGrid = Array.from({ length: 12 }, (_, i) => startYear + i);

  // Dynamic Navigation arrow handlers based on active view grid
  const handlePrev = () => {
    if (pickerView === 'days') {
      if (navMonth === 0) {
        setNavMonth(11);
        setNavYear(navYear - 1);
      } else {
        setNavMonth(navMonth - 1);
      }
    } else if (pickerView === 'months') {
      setNavYear(navYear - 1);
    } else if (pickerView === 'years') {
      setNavYear(navYear - 12);
    }
  };

  const handleNext = () => {
    if (pickerView === 'days') {
      if (navMonth === 11) {
        setNavMonth(0);
        setNavYear(navYear + 1);
      } else {
        setNavMonth(navMonth + 1);
      }
    } else if (pickerView === 'months') {
      setNavYear(navYear + 1);
    } else if (pickerView === 'years') {
      setNavYear(navYear + 12);
    }
  };

  // Monday-start days grid calculations
  const daysInMonth = new Date(navYear, navMonth + 1, 0).getDate();
  const firstDayIndexJs = new Date(navYear, navMonth, 1).getDay(); // Sunday=0, Monday=1, ...
  
  // Shift Sunday (0) to index 6, others shift left by 1
  const firstDayIndex = firstDayIndexJs === 0 ? 6 : firstDayIndexJs - 1;

  const prevMonthDaysCount = new Date(navYear, navMonth, 0).getDate();

  // Create full 42-day calendar grid entries
  const gridCells = [];

  // Preceding month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    gridCells.push({
      day: prevMonthDaysCount - i,
      monthOffset: -1,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    gridCells.push({
      day: i,
      monthOffset: 0,
      isCurrentMonth: true
    });
  }

  // Succeeding month padding days to fill 42 cells grid
  const remainingCells = 42 - gridCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    gridCells.push({
      day: i,
      monthOffset: 1,
      isCurrentMonth: false
    });
  }

  const monthsName = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const monthsShortName = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  return (
    <div className="relative w-full font-[var(--font-body)]" ref={containerRef}>
      {/* Date trigger input box */}
      <div 
        onClick={toggleOpen}
        className={`w-full flex items-center justify-between bg-gray-50/70 border border-transparent rounded-[var(--radius-card)] py-3.5 px-4 text-sm text-gray-900 focus-within:border-primary focus-within:bg-white transition-all cursor-pointer select-none min-h-[48px] ${className}`}
        style={{
          borderWidth: '1.5px',
          borderColor: isOpen ? 'var(--color-primary)' : 'var(--color-border)',
          backgroundColor: isOpen ? '#FFFFFF' : '#FAFAFA',
          boxShadow: isOpen ? '0 0 0 4px rgba(194, 24, 91, 0.08)' : 'none'
        }}
      >
        <span className={formattedDisplayValue ? 'text-gray-900 font-medium' : 'text-gray-400 text-xs'}>
          {formattedDisplayValue || placeholder}
        </span>

        {/* Calendar Icon */}
        <svg 
          className="w-5 h-5 text-primary shrink-0 transition-transform duration-200" 
          style={{ transform: isOpen ? 'scale(1.15)' : 'none' }}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008z" />
        </svg>
      </div>

      {/* Embedded hidden input for HTML form triggers */}
      <input 
        id={id}
        type="hidden" 
        value={value} 
        required={required}
      />

      {/* Portal Calendar Centered Modal Overlay */}
      {isOpen && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 animate-in fade-in duration-200"
          onClick={handleCancel}
        >
          <div 
            className="bg-white rounded-xl p-4 w-80 max-w-[90vw] shadow-2xl relative select-none animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header control bar */}
            <div className="bg-gray-50/80 border border-gray-100/50 rounded-xl flex items-center justify-between p-1.5 mb-3">
              {/* Prev arrow button */}
              <button 
                type="button" 
                onClick={handlePrev}
                className="w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100/80 hover:bg-gray-50 text-gray-600 flex items-center justify-center cursor-pointer transition-all active:scale-95 focus:outline-none"
              >
                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              {/* Dynamic Header Label (No down arrows) */}
              <div className="flex-1 text-center">
                {pickerView === 'days' && (
                  <button
                    type="button"
                    onClick={() => setPickerView('months')}
                    className="font-bold text-gray-800 text-sm hover:text-primary transition-colors cursor-pointer focus:outline-none active:scale-95 transition-transform duration-100"
                  >
                    {monthsName[navMonth]} {navYear}
                  </button>
                )}

                {pickerView === 'months' && (
                  <button
                    type="button"
                    onClick={() => setPickerView('years')}
                    className="font-bold text-gray-800 text-sm hover:text-primary transition-colors cursor-pointer focus:outline-none active:scale-95 transition-transform duration-100"
                  >
                    {navYear}
                  </button>
                )}

                {pickerView === 'years' && (
                  <span className="font-bold text-gray-800 text-sm">
                    {startYear} - {startYear + 11}
                  </span>
                )}
              </div>

              {/* Next arrow button */}
              <button 
                type="button" 
                onClick={handleNext}
                className="w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100/80 hover:bg-gray-50 text-gray-600 flex items-center justify-center cursor-pointer transition-all active:scale-95 focus:outline-none"
              >
                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>

            {/* ===== DAYS VIEW GRID ===== */}
            {pickerView === 'days' && (
              <>
                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-1 text-center py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, idx) => (
                    <div key={idx} className="w-full py-1">{day}</div>
                  ))}
                </div>

                {/* Days Grid (42 Cells) */}
                <div className="grid grid-cols-7 gap-1 text-center mt-1">
                  {gridCells.map((cell, index) => {
                    const { day, monthOffset, isCurrentMonth } = cell;
                    
                    let targetMonth = navMonth + monthOffset;
                    let targetYear = navYear;
                    if (targetMonth < 0) {
                      targetMonth = 11;
                      targetYear -= 1;
                    } else if (targetMonth > 11) {
                      targetMonth = 0;
                      targetYear += 1;
                    }

                    const formattedMonth = String(targetMonth + 1).padStart(2, '0');
                    const formattedDay = String(day).padStart(2, '0');
                    const itemValue = `${targetYear}-${formattedMonth}-${formattedDay}`;
                    
                    const isPastMin = min ? itemValue < min : false;
                    const isFutureMax = max ? itemValue > max : false;
                    const isDisabled = isPastMin || isFutureMax;

                    const isSelected = tempDate && tempDate === itemValue;

                    const isToday = new Date().getFullYear() === targetYear && 
                                    new Date().getMonth() === targetMonth && 
                                    new Date().getDate() === day;

                    return (
                      <button
                        key={`day-${monthOffset}-${day}-${index}`}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => selectDay(day, monthOffset)}
                        className={`w-full aspect-square text-xs font-semibold rounded-xl flex items-center justify-center transition-transform duration-100 focus:outline-none ${
                          isDisabled 
                            ? 'text-gray-200 cursor-not-allowed line-through' 
                            : isSelected
                              ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105 cursor-pointer font-bold active:bg-primary-dark active:scale-95'
                              : isCurrentMonth
                                ? isToday
                                  ? 'text-primary border border-primary/40 bg-primary/5 hover:bg-primary/10 cursor-pointer active:bg-gray-100 active:scale-95'
                                  : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100 active:scale-95 cursor-pointer'
                                : 'text-gray-300 hover:bg-gray-50/50 cursor-pointer font-normal active:bg-gray-100 active:scale-95'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* ===== MONTHS VIEW GRID ===== */}
            {pickerView === 'months' && (
              <div className="grid grid-cols-3 gap-2 py-3">
                {monthsShortName.map((name, index) => {
                  const isSelected = navMonth === index;
                  return (
                    <button
                      key={`month-${index}`}
                      type="button"
                      onClick={() => {
                        setNavMonth(index);
                        setPickerView('days');
                      }}
                      className={`py-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer focus:outline-none text-center active:scale-95 active:bg-gray-100 transition-transform duration-100 ${
                        isSelected
                          ? 'bg-primary text-white shadow-md shadow-primary/10'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-100'
                      }`}
                    >
                      {monthsName[index]}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ===== YEARS VIEW GRID ===== */}
            {pickerView === 'years' && (
              <div className="grid grid-cols-3 gap-2 py-3 max-h-[220px] overflow-y-auto pr-1">
                {yearsGrid.map((y) => {
                  const isSelected = navYear === y;
                  return (
                    <button
                      key={`year-${y}`}
                      type="button"
                      onClick={() => {
                        setNavYear(y);
                        setPickerView('months');
                      }}
                      className={`py-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer focus:outline-none text-center active:scale-95 active:bg-gray-100 transition-transform duration-100 ${
                        isSelected
                          ? 'bg-primary text-white shadow-md shadow-primary/10'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-100'
                      }`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Footer Action Row (Cancel & Enter) */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition-transform duration-100 active:bg-gray-100 active:scale-95 focus:outline-none"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark cursor-pointer transition-transform duration-100 active:scale-95 focus:outline-none"
              >
                Pilih
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
