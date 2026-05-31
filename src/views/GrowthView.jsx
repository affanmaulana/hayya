import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrowth } from '../hooks/useGrowth';
import { useChild } from '../hooks/useChild';
import { formatDate } from '../utils/dateHelpers';

export default function GrowthView() {
  const navigate = useNavigate();
  const { activeChild, isLoading } = useChild();
  const { getGrowthRecords, addGrowthRecord, deleteGrowthRecord } = useGrowth();

  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCircCm, setHeadCircCm] = useState('');
  const [measuredAt, setMeasuredAt] = useState('');
  const [notes, setNotes] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('ringkasan');
  const [activeMetric, setActiveMetric] = useState('tinggi'); // 'berat', 'tinggi', 'lingkarKepala', 'lila'
  const [editingRecordId, setEditingRecordId] = useState(null);

  // Auto-dismiss toast message after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // ----- RENDER LOADING STATE -----
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 space-y-4 font-[var(--font-body)]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-text-secondary font-medium">Memuat data si kecil...</p>
      </div>
    );
  }

  // ----- RENDER EMPTY STATE (No Active Child) -----
  if (!activeChild) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-5 font-[var(--font-body)]">
        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center text-3xl shadow-sm border border-primary/10">
          📈
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold font-[var(--font-heading)] text-text">
            Bunda Belum Memilih Profil Si Kecil
          </h2>
          <p className="text-sm text-text-secondary max-w-[280px] leading-relaxed mx-auto">
            Yuk, daftarkan atau pilih profil si kecil terlebih dahulu di Beranda untuk mencatat data pertumbuhannya. 🧡
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="h-11 px-6 rounded-button bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-colors shadow-md shadow-primary/10 cursor-pointer"
        >
          Ke Beranda
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToastMessage('');
    setSubmitting(true);
    try {
      if (!activeChild) throw new Error('Tidak ada anak aktif.');
      
      const record = {
        weightKg,
        heightCm,
        headCircCm: headCircCm || null,
        measuredAt,
        notes,
      };

      if (editingRecordId) {
        // Validate input limits before deletion
        const w = parseFloat(weightKg);
        if (isNaN(w) || w < 1.0 || w > 40.0) throw new Error('Berat badan harus di antara 1.0 kg dan 40.0 kg, Bunda. 🧡');
        const h = parseFloat(heightCm);
        if (isNaN(h) || h < 30.0 || h > 130.0) throw new Error('Tinggi badan harus di antara 30.0 cm dan 130.0 cm, Bunda. 🧡');
        if (headCircCm) {
          const hc = parseFloat(headCircCm);
          if (isNaN(hc) || hc < 25.0 || hc > 60.0) throw new Error('Lingkar kepala harus di antara 25.0 cm dan 60.0 cm, Bunda. 🧡');
        }
        
        // Date checks
        const dob = new Date(activeChild.dateOfBirth);
        const measured = new Date(measuredAt);
        const today = new Date();
        const dobDateOnly = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
        const measuredDateOnly = new Date(measured.getFullYear(), measured.getMonth(), measured.getDate());
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (measuredDateOnly > todayDateOnly) throw new Error('Tanggal pengukuran tidak boleh melewati hari ini, Bunda. 🧡');
        if (measuredDateOnly < dobDateOnly) throw new Error(`Tanggal tidak boleh mendahului tanggal lahir (${activeChild.dateOfBirth}), Bunda. 🧡`);

        // Check duplicates excluding self
        const otherRecords = records.filter(r => r.id !== editingRecordId);
        if (otherRecords.some(r => r.measuredAt === measuredAt)) {
          throw new Error(`Bunda sudah memiliki catatan pertumbuhan pada tanggal ${measuredAt}.`);
        }

        // Safe delete
        await deleteGrowthRecord(editingRecordId);
      }

      await addGrowthRecord(activeChild.id, record);
      
      // clear form
      setWeightKg('');
      setHeightCm('');
      setHeadCircCm('');
      setMeasuredAt('');
      setNotes('');
      setEditingRecordId(null);
      setIsOpen(false);
    } catch (err) {
      setToastMessage(err.message || 'Gagal menyimpan catatan pertumbuhan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingRecordId) return;
    setSubmitting(true);
    try {
      await deleteGrowthRecord(editingRecordId);
      setWeightKg('');
      setHeightCm('');
      setHeadCircCm('');
      setMeasuredAt('');
      setNotes('');
      setEditingRecordId(null);
      setIsOpen(false);
    } catch (err) {
      setToastMessage(err.message || 'Gagal menghapus catatan.');
    } finally {
      setSubmitting(false);
    }
  };

  const records = activeChild ? getGrowthRecords(activeChild.id) : [];

  // Reset form fields when the active child changes
  useEffect(() => {
    setWeightKg('');
    setHeightCm('');
    setHeadCircCm('');
    setMeasuredAt('');
    setNotes('');
    setIsOpen(false);
  }, [activeChild?.id]);

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

      {/* Floating Center Toast Notification Popup with Auto-dismiss */}
      {toastMessage && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-99 flex items-center justify-center w-full max-w-[320px] px-4 animate-fade-in">
          <div className="bg-gray-900/95 backdrop-blur-md text-white text-xs font-semibold py-3 px-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] flex items-center gap-2 border border-white/10">
            <span>⚠️</span>
            <span className="leading-relaxed">{toastMessage}</span>
          </div>
        </div>
      )}

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
            onClick={() => setIsOpen(true)}
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
                      onClick={() => handleEditClick(r)}
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
        onClick={() => {
          setEditingRecordId(null);
          setWeightKg('');
          setHeightCm('');
          setHeadCircCm('');
          setMeasuredAt('');
          setNotes('');
          setIsOpen(true);
        }}
        className="fixed bottom-24 right-6 md:right-[calc(50%-384px+24px)] lg:right-[calc(50%-512px+24px)] left-auto z-30 w-14 h-14 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex items-center justify-center text-gray-800 text-3xl font-light hover:bg-black/[0.02] active:scale-95 transition-all cursor-pointer"
        aria-label="Tambah catatan pertumbuhan"
      >
        +
      </button>

      {/* Backdrop overlay - z-40 to stay in front of main content and behind modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* STRICT iOS-Style Bottom Sheet Modal - max-h-[85vh], flex flex-col, z-50 */}
      <div
        className="fixed bottom-0 left-1/2 w-full max-w-[448px] max-h-[85vh] bg-white rounded-t-[32px] p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? 'translate(-50%, 0)' : 'translate(-50%, 100%)' }}
      >
        {/* Top Accent Bar */}
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 shrink-0" />

        {/* Premium Clean Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-gray-900 font-bold text-lg tracking-tight">
            {editingRecordId ? 'Ubah Catatan Pertumbuhan' : 'Tambah Catatan Pertumbuhan'}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 cursor-pointer font-bold text-base focus:outline-none"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Clean Input Fields Form with isolated scroll wrapper and static bottom actions */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          {/* Isolated Scrollable Body Container with gentle horizontal padding to prevent focused border clipping */}
          <div className="w-full flex-1 overflow-y-auto px-1.5 pr-2.5 my-3 scrollbar-none pb-28">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="weightKg">Berat (kg) *</label>
              <input
                id="weightKg"
                type="number"
                step="0.01"
                min="1"
                max="40"
                placeholder="0.00"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                required
                className="w-full bg-gray-50/70 border border-transparent rounded-2xl py-3.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-0 transition-all mb-4"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="heightCm">Tinggi (cm) *</label>
              <input
                id="heightCm"
                type="number"
                step="0.1"
                min="30"
                max="130"
                placeholder="0.0"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                required
                className="w-full bg-gray-50/70 border border-transparent rounded-2xl py-3.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-0 transition-all mb-4"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="headCircCm">Lingkar Kepala (cm) (opsional)</label>
              <input
                id="headCircCm"
                type="number"
                step="0.1"
                min="25"
                max="60"
                placeholder="0.0"
                value={headCircCm}
                onChange={(e) => setHeadCircCm(e.target.value)}
                className="w-full bg-gray-50/70 border border-transparent rounded-2xl py-3.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-0 transition-all mb-4"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="measuredAt">Tanggal Pengukuran *</label>
              <input
                id="measuredAt"
                type="date"
                value={measuredAt}
                onChange={(e) => setMeasuredAt(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
                className="w-full bg-gray-50/70 border border-transparent rounded-2xl py-3.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-0 transition-all mb-4 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 block mb-1" htmlFor="notes">Catatan (opsional)</label>
              <textarea
                id="notes"
                rows={2}
                placeholder="Tambahkan catatan di sini..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50/70 border border-transparent rounded-2xl py-3.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-600 focus:bg-white focus:ring-0 transition-all mb-4"
              />
            </div>
          </div>

          {/* High-Leverage Capsule Button - BRANDING PINK COLOR (bg-primary) - static outside scroll wrapper */}
          <div className="shrink-0 pt-2 bg-white">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-medium text-sm rounded-full shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : (editingRecordId ? 'Simpan Perubahan' : 'Simpan Catatan')}
            </button>

            {editingRecordId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="w-full mt-3 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-full transition-all active:scale-[0.98] cursor-pointer text-center"
              >
                Hapus Catatan
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
