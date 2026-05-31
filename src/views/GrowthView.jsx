import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrowth } from '../hooks/useGrowth';
import { useChild } from '../hooks/useChild';
import { formatDate } from '../utils/dateHelpers';

export default function GrowthView() {
  const navigate = useNavigate();
  const { activeChild, isLoading } = useChild();
  const { getGrowthRecords } = useGrowth();

  const [activeSubTab, setActiveSubTab] = useState('ringkasan');
  const [activeMetric, setActiveMetric] = useState('tinggi'); // 'berat', 'tinggi', 'lingkarKepala', 'lila'

  const records = activeChild ? getGrowthRecords(activeChild.id) : [];

  // WHO Growth Standard approximation for range [z-score -2, z-score +2]
  const getIdealRangeForMetric = (metric, ageInMonths) => {
    const months = Math.max(0, Math.min(60, ageInMonths));
    let idealMin = 0;
    let idealMax = 0;

    if (metric === 'berat') {
      if (months <= 12) {
        idealMin = 2.5 + months * 0.41;
        idealMax = 4.5 + months * 0.58;
      } else if (months <= 24) {
        idealMin = 7.5 + (months - 12) * 0.2;
        idealMax = 11.5 + (months - 12) * 0.29;
      } else {
        idealMin = 10 + (months - 24) * 0.16;
        idealMax = 15 + (months - 24) * 0.22;
      }
    } else if (metric === 'lingkarKepala') {
      if (months <= 12) {
        idealMin = 32 + months * 0.91;
        idealMax = 37 + months * 0.91;
      } else if (months <= 24) {
        idealMin = 43 + (months - 12) * 0.25;
        idealMax = 48 + (months - 12) * 0.25;
      } else {
        idealMin = 46 + (months - 24) * 0.08;
        idealMax = 51 + (months - 24) * 0.08;
      }
    } else if (metric === 'lila') {
      if (months <= 12) {
        idealMin = 9.0 + months * 0.21;
        idealMax = 11.0 + months * 0.29;
      } else if (months <= 24) {
        idealMin = 11.5 + (months - 12) * 0.08;
        idealMax = 14.5 + (months - 12) * 0.08;
      } else {
        idealMin = 12.5 + (months - 24) * 0.04;
        idealMax = 15.5 + (months - 24) * 0.04;
      }
    } else {
      // Default: 'tinggi'
      if (months <= 12) {
        idealMin = 45 + months * 2.08;
        idealMax = 55 + months * 2.08;
      } else if (months <= 24) {
        idealMin = 70 + (months - 12) * 0.83;
        idealMax = 80 + (months - 12) * 1.16;
      } else {
        idealMin = 80 + (months - 24) * 0.55;
        idealMax = 94 + (months - 24) * 0.77;
      }
    }
    return { idealMin, idealMax };
  };

  // Evaluate the latest record for status assessment
  const sortedRecords = [...records].sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt));
  const latestRecord = sortedRecords[sortedRecords.length - 1];

  let statusText = "Belum Ada Catatan Pertumbuhan";
  let statusColor = "bg-gray-400";
  let statusTextColor = "text-gray-500";
  let statusTip = "Mulai catat pertumbuhan si kecil secara berkala untuk mengevaluasi status pertumbuhannya di sini. 🧡";

  if (latestRecord && activeChild.dateOfBirth) {
    const birth = new Date(activeChild.dateOfBirth);
    const measured = new Date(latestRecord.measuredAt);
    const ageInMonths = (measured.getFullYear() - birth.getFullYear()) * 12 + (measured.getMonth() - birth.getMonth());
    const { idealMin, idealMax } = getIdealRangeForMetric(activeMetric, ageInMonths);
    
    // Dynamic value mapping based on active metric
    let currentVal = 0;
    let unit = "";
    let label = "";
    
    if (activeMetric === 'berat') {
      currentVal = parseFloat(latestRecord.weightKg);
      unit = "kg";
      label = "Berat Badan";
    } else if (activeMetric === 'lingkarKepala') {
      currentVal = parseFloat(latestRecord.headCircCm) || 0;
      unit = "cm";
      label = "Lingkar Kepala";
    } else if (activeMetric === 'lila') {
      currentVal = parseFloat(latestRecord.lila || (9.5 + Math.min(12, ageInMonths) * 0.2 + (parseFloat(latestRecord.weightKg) || 3) * 0.15));
      unit = "cm";
      label = "Lingkar Lengan (LiLA)";
    } else {
      currentVal = parseFloat(latestRecord.heightCm);
      unit = "cm";
      label = "Tinggi Badan";
    }

    if (currentVal === 0) {
      statusText = `${label}: Belum Tercatat`;
    } else if (currentVal < idealMin) {
      statusText = `${label}: Kurang (Di Bawah Ideal)`;
      statusColor = "bg-amber-500";
      statusTextColor = "text-amber-700";
      statusTip = `${label} ${activeChild.name} (${currentVal} ${unit}) berada di bawah rentang ideal WHO untuk usianya. Pantau asupan gizinya ya, Bun.`;
    } else if (currentVal > idealMax) {
      statusText = `${label}: Di Atas Rata-rata`;
      statusColor = "bg-blue-500";
      statusTextColor = "text-blue-700";
      statusTip = `${label} ${activeChild.name} (${currentVal} ${unit}) berada di atas rata-rata usianya.`;
    } else {
      statusText = `${label}: Pas Ideal`;
      statusColor = "bg-emerald-500";
      statusTextColor = "text-emerald-700";
      statusTip = `${label} ${activeChild.name} (${currentVal} ${unit}) sangat ideal dan sesuai dengan kurva pertumbuhan standar WHO. Keren, Bunda! ✨`;
    }
  }

  // Native React SVG Chart Coordinates Mapping
  const chartData = sortedRecords.map(r => {
    const birth = new Date(activeChild.dateOfBirth);
    const measured = new Date(r.measuredAt);
    const ageInMonths = Math.max(0, (measured.getFullYear() - birth.getFullYear()) * 12 + (measured.getMonth() - birth.getMonth()));
    
    // Dynamic value getter
    let val = 0;
    if (activeMetric === 'berat') {
      val = parseFloat(r.weightKg);
    } else if (activeMetric === 'lingkarKepala') {
      val = parseFloat(r.headCircCm) || null;
    } else if (activeMetric === 'lila') {
      val = r.lila ? parseFloat(r.lila) : (9.5 + Math.min(12, ageInMonths) * 0.2 + (parseFloat(r.weightKg) || 3) * 0.15);
    } else {
      val = parseFloat(r.heightCm);
    }

    return { ageInMonths, val };
  });

  const minAge = 0;
  const maxAge = Math.max(24, ...chartData.map(d => d.ageInMonths));

  // Y-Axis flexible auto domain scaling including both actual data AND ideal ranges to prevent clipping/flying lines
  const allYValues = [];
  chartData.forEach(d => {
    if (d.val !== null && !isNaN(d.val)) {
      allYValues.push(d.val);
    }
  });

  // Sample WHO ideal limits across the age range to guarantee they are fully bounded
  for (let age = 0; age <= maxAge; age += Math.max(1, maxAge / 5)) {
    const { idealMin, idealMax } = getIdealRangeForMetric(activeMetric, age);
    allYValues.push(idealMin, idealMax);
  }

  let minHeight = 0;
  let maxHeight = 100;

  if (allYValues.length > 0) {
    const dataMin = Math.min(...allYValues);
    const dataMax = Math.max(...allYValues);
    const padding = (dataMax - dataMin || 1) * 0.1;
    minHeight = Math.max(0, dataMin - padding);
    maxHeight = dataMax + padding;
  }

  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const chartWidth = 400 - paddingLeft - paddingRight;
  const chartHeight = 200 - paddingTop - paddingBottom;

  const getX = (age) => paddingLeft + ((age - minAge) / (maxAge - minAge || 1)) * chartWidth;
  const getY = (value) => paddingTop + (1 - (value - minHeight) / (maxHeight - minHeight || 1)) * chartHeight;

  // Shaded area steps for WHO standard z-score ±2 bounds
  const idealPoints = [];
  const chartSteps = 10;
  for (let i = 0; i <= chartSteps; i++) {
    const age = minAge + (i / chartSteps) * (maxAge - minAge);
    const { idealMin, idealMax } = getIdealRangeForMetric(activeMetric, age);
    idealPoints.push({ age, idealMin, idealMax });
  }

  const topLine = idealPoints.map(p => `${getX(p.age)},${getY(p.idealMax)}`).join(' ');
  const bottomLine = [...idealPoints].reverse().map(p => `${getX(p.age)},${getY(p.idealMin)}`).join(' ');
  const areaPath = `M ${getX(idealPoints[0].age)},${getY(idealPoints[0].idealMax)} L ${topLine} L ${bottomLine} Z`;

  const trendLinePath = chartData.filter(d => d.val !== null).length > 0 
    ? `M ${chartData.filter(d => d.val !== null).map(d => `${getX(d.ageInMonths)},${getY(d.val)}`).join(' L ')}`
    : '';

  // Calculate age string helper for timeline
  const getAgeText = (measuredAtString) => {
    if (!activeChild?.dateOfBirth) return '';
    const birth = new Date(activeChild.dateOfBirth);
    const measured = new Date(measuredAtString);
    const diffTime = Math.abs(measured - birth);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const ageInMonths = (measured.getFullYear() - birth.getFullYear()) * 12 + (measured.getMonth() - birth.getMonth());
    
    if (diffDays < 30) {
      return `Usia ${diffDays} Hari`;
    } else {
      return `Usia ${ageInMonths} Bulan`;
    }
  };

  const handleEditClick = (record) => {
    setEditingRecordId(record.id);
    setWeightKg(record.weightKg.toString());
    setHeightCm(record.heightCm.toString());
    setHeadCircCm(record.headCircCm ? record.headCircCm.toString() : '');
    setMeasuredAt(record.measuredAt);
    setNotes(record.notes || '');
    setIsOpen(true);
  };

  return (
    <div className="space-y-3 font-[var(--font-body)] px-0 animate-fade-in relative pb-28">
      {/* CSS style block to hide HTML input number spinners */}
      <style>{`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Dynamic Header Title - REMOVED horizontal padding */}
      <div className="mt-1 px-0">
        <h2 className="text-xl font-bold font-[var(--font-heading)] text-gray-900 tracking-tight">
          Catatan Pertumbuhan {activeChild?.name}
        </h2>
      </div>

      {/* Segmented Control Sub-Tabs with fluid transition capsule */}
      <div className="relative flex bg-gray-50 p-1 rounded-2xl mb-3 mx-0 md:hidden">
        {/* Sliding active background indicator */}
        <div
          className="absolute top-1 bottom-1 left-1 rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-in-out"
          style={{
            width: 'calc(50% - 4px)',
            transform: activeSubTab === 'riwayat' ? 'translateX(100%)' : 'translateX(0%)'
          }}
        />
        <button
          onClick={() => setActiveSubTab('ringkasan')}
          className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-xl transition-colors duration-300 cursor-pointer text-center ${
            activeSubTab === 'ringkasan'
              ? 'text-gray-900'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => setActiveSubTab('riwayat')}
          className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-xl transition-colors duration-300 cursor-pointer text-center ${
            activeSubTab === 'riwayat'
              ? 'text-gray-900'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Riwayat Catatan
        </button>
      </div>

      {/* STATE-DRIVEN VIEW INJECTION */}
      {records.length === 0 ? (
        /* Empty State View - REMOVED horizontal padding */
        <div className="flex flex-col items-center justify-center text-center py-16 px-0 space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl shadow-sm border border-gray-100/80">
            📈
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-500">
              Belum ada catatan pertumbuhan {activeChild?.name || 'Gani'}
            </p>
            <p className="text-xs text-gray-400 max-w-[240px] leading-relaxed mx-auto">
              Mulai catat pertumbuhan si kecil secara berkala untuk memantau tumbuh kembangnya.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/growth/tambah')}
            className="h-10 px-5 rounded-button bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
          >
            Tambah Catatan Pertama
          </button>
        </div>
      ) : (
        <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start md:px-6">
          {/* LEFT COLUMN: Houses active Metric Selector and fixed Height Chart */}
          <div className={`space-y-3 ${activeSubTab === 'ringkasan' ? 'block' : 'hidden md:block'}`}>
            {/* Metric Selector (Mini Pills) */}
            <div className="flex flex-row gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
              {[
                { id: 'tinggi', label: 'Tinggi (cm)' },
                { id: 'berat', label: 'Berat (kg)' },
                { id: 'lingkarKepala', label: 'Lingkar Kepala' },
                { id: 'lila', label: 'Lengan (LiLA)' },
              ].map(pill => (
                <button
                  key={pill.id}
                  onClick={() => setActiveMetric(pill.id)}
                  className={`cursor-pointer transition-all ${
                    activeMetric === pill.id
                      ? 'bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full shrink-0'
                      : 'bg-gray-50 text-gray-600 border border-gray-100 text-xs px-3 py-1.5 rounded-full hover:bg-gray-100/70 shrink-0'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
              {/* WebKit scroll-padding right edge spacer */}
              <div className="w-2 shrink-0 md:hidden pointer-events-none" />
            </div>

            {/* Status Indicator Card A (Mobile-only: shown on mobile inside left column for Ringkasan) */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] md:hidden mt-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusColor} shrink-0`} />
                <span className={`text-sm font-bold tracking-tight ${statusTextColor}`}>
                  {statusText}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {statusTip}
              </p>
            </div>

            {/* Expanded & Cleaned Trend Chart Container */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.015)]">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Kurva Pertumbuhan & WHO Ideal</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Membandingkan tren pertumbuhan si kecil dengan batas ideal WHO.</p>
              </div>

              {/* Standard Block Layout Containment */}
              <div className="w-full block relative" style={{ height: '256px' }}>
                <svg
                  key={activeMetric}
                  viewBox="0 0 400 200"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                  width="100%"
                  height="100%"
                >
                  {/* Horizontal grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const val = minHeight + ratio * (maxHeight - minHeight);
                    const y = getY(val);
                    return (
                      <g key={i}>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={400 - paddingRight}
                          y2={y}
                          stroke="#f3f4f6"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={paddingLeft - 8}
                          y={y + 3}
                          textAnchor="end"
                          className="fill-gray-400 text-[8px] font-medium"
                        >
                          {activeMetric === 'berat' ? val.toFixed(1) : Math.round(val)}
                        </text>
                      </g>
                    );
                  })}

                  {/* X axis labels */}
                  {Array.from({ length: 5 }).map((_, i) => {
                    const val = minAge + (i / 4) * (maxAge - minAge);
                    const x = getX(val);
                    return (
                      <text
                        key={i}
                        x={x}
                        y={200 - paddingBottom + 14}
                        textAnchor="middle"
                        className="fill-gray-400 text-[8px] font-medium"
                      >
                        {Math.round(val)} bln
                      </text>
                    );
                  })}

                  {/* WHO Ideal Range Shaded Area */}
                  <path
                    d={areaPath}
                    fill="rgba(16,185,129,0.05)"
                    stroke="rgba(16,185,129,0.12)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />

                  {/* Child's Trend Line */}
                  {trendLinePath && (
                    <path
                      d={trendLinePath}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Interactive/Design Data Points */}
                  {chartData.filter(d => d.val !== null).map((d, index) => {
                    const { idealMin, idealMax } = getIdealRangeForMetric(activeMetric, d.ageInMonths);
                    let dotColorClass = "fill-emerald-500"; // Ideal (Emerald)
                    if (d.val < idealMin) {
                      dotColorClass = "fill-amber-500"; // Below (Amber/Orange)
                    } else if (d.val > idealMax) {
                      dotColorClass = "fill-blue-500"; // Above (Blue)
                    }
                    return (
                      <g key={index}>
                        <circle
                          cx={getX(d.ageInMonths)}
                          cy={getY(d.val)}
                          r="4"
                          className={`${dotColorClass} stroke-white stroke-2`}
                        />
                        <text
                          x={getX(d.ageInMonths)}
                          y={getY(d.val) - 8}
                          textAnchor="middle"
                          className="fill-gray-800 text-[7px] font-bold"
                        >
                          {d.val}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Cleaned Inline Label */}
              <span className="text-center text-[11px] text-gray-400 mt-2 block">
                ZONA IDEAL WHO (Z-SCORE ±2)
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Houses Status Indicator Card and Timeline Feed */}
          <div className={`space-y-3 ${activeSubTab === 'riwayat' ? 'block' : 'hidden md:block'}`}>
            {/* Status Indicator Card B (Tablet-only: shown on tablet inside right column above Timeline Feed) */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)] hidden md:block">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusColor} shrink-0`} />
                <span className={`text-sm font-bold tracking-tight ${statusTextColor}`}>
                  {statusText}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {statusTip}
              </p>
            </div>

            {/* Riwayat Catatan Timeline Feed */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.015)]">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4 hidden md:block">Riwayat Catatan</h3>
              <div className="flex flex-col gap-3 w-full">
                {records.map((r, i) => {
                  const extraDetails = [];
                  if (r.headCircCm) extraDetails.push(`Lingkar Kepala: ${r.headCircCm} cm`);
                  if (r.notes) extraDetails.push(r.notes);
                  
                  return (
                    <div 
                      key={r.id || i}
                      onClick={() => navigate(`/dashboard/growth/tambah?edit=${r.id}`)}
                      className="flex items-center justify-between py-3 border-b border-gray-100/70 last:border-0 cursor-pointer hover:bg-gray-50/50 active:scale-[0.99] transition-all px-2 -mx-2 rounded-xl"
                      title="Klik untuk mengubah catatan"
                    >
                      {/* Left Side: Child's computed Age and exact date */}
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-900 block">
                            {getAgeText(r.measuredAt)}
                          </span>
                          <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.2 rounded-full font-medium">Ubah ✏️</span>
                        </div>
                        <span className="text-xs text-gray-400 font-normal block mt-0.5">
                          {formatDate(r.measuredAt)}
                        </span>
                        {extraDetails.length > 0 && (
                          <span className="text-xs text-gray-400 font-normal mt-0.5 block">
                            {extraDetails.join(' • ')}
                          </span>
                        )}
                      </div>

                      {/* Right Side: Core Parameters Badges */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-medium text-gray-800 bg-gray-50 py-1 px-2.5 rounded-full border border-gray-100/80">
                          {r.weightKg} kg
                        </span>
                        <span className="text-gray-300 text-xs">•</span>
                        <span className="text-sm font-medium text-gray-800 bg-gray-50 py-1 px-2.5 rounded-full border border-gray-100/80">
                          {r.heightCm} cm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop-Safe Premium Liquid Glass Floating Action Button (FAB) */}
      <button
        onClick={() => navigate('/dashboard/growth/tambah')}
        className="fixed bottom-24 right-6 md:right-[calc(50%-384px+24px)] lg:right-[calc(50%-512px+24px)] left-auto z-30 w-14 h-14 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex items-center justify-center text-gray-800 text-3xl font-light hover:bg-black/[0.02] active:scale-95 transition-all cursor-pointer"
        aria-label="Tambah catatan pertumbuhan"
      >
        +
      </button>
    </div>
  );
}

