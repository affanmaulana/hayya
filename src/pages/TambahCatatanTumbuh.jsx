import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGrowth } from '../hooks/useGrowth';
import { useChild } from '../hooks/useChild';
import CustomDatePicker from '../components/CustomDatePicker.jsx';

/**
 * TambahCatatanTumbuh - Standalone Page for Adding or Editing growth records.
 * Replaces the old bottom sheet modal. Fully styled matching ManageChildrenView.
 */
export default function TambahCatatanTumbuh() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const { activeChild, isLoading: childLoading } = useChild();
  const { getGrowthRecords, addGrowthRecord, deleteGrowthRecord } = useGrowth();

  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCircCm, setHeadCircCm] = useState('');
  const [lilaCm, setLilaCm] = useState('');
  const [measuredAt, setMeasuredAt] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBack = () => {
    setIsLeaving(true);
    setTimeout(() => {
      navigate('/dashboard/growth?tab=riwayat');
    }, 220);
  };

  useEffect(() => {
    const onAnimateOut = () => handleBack();
    window.addEventListener('animate-out-tambah', onAnimateOut);
    return () => window.removeEventListener('animate-out-tambah', onAnimateOut);
  }, [activeChild, navigate]);

  // Load existing record details if editing
  useEffect(() => {
    if (editId && activeChild) {
      const records = getGrowthRecords(activeChild.id);
      const record = records.find(r => r.id === editId);
      if (record) {
        setWeightKg(record.weightKg.toString());
        setHeightCm(record.heightCm.toString());
        setHeadCircCm(record.headCircCm ? record.headCircCm.toString() : '');
        setLilaCm(record.lila ? record.lila.toString() : '');
        setMeasuredAt(record.measuredAt);
        setNotes(record.notes || '');
      }
    }
  }, [editId, activeChild]);

  // Handle save/submit record
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (!activeChild) {
        throw new Error('Tidak ada anak aktif yang terpilih.');
      }

      const w = parseFloat(weightKg);
      if (isNaN(w) || w < 1.0 || w > 40.0) {
        throw new Error('Berat badan harus di antara 1.0 kg dan 40.0 kg, Bunda. 🧡');
      }

      const h = parseFloat(heightCm);
      if (isNaN(h) || h < 30.0 || h > 130.0) {
        throw new Error('Tinggi badan harus di antara 30.0 cm dan 130.0 cm, Bunda. 🧡');
      }

      if (headCircCm) {
        const hc = parseFloat(headCircCm);
        if (isNaN(hc) || hc < 25.0 || hc > 60.0) {
          throw new Error('Lingkar kepala harus di antara 25.0 cm dan 60.0 cm, Bunda. 🧡');
        }
      }

      if (lilaCm) {
        const l = parseFloat(lilaCm);
        if (isNaN(l) || l < 5.0 || l > 30.0) {
          throw new Error('Lingkar lengan atas harus di antara 5.0 cm dan 30.0 cm, Bunda. 🧡');
        }
      }

      // Date constraints
      const dob = new Date(activeChild.dateOfBirth);
      const measured = new Date(measuredAt);
      const today = new Date();
      const dobDateOnly = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
      const measuredDateOnly = new Date(measured.getFullYear(), measured.getMonth(), measured.getDate());
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      if (measuredDateOnly > todayDateOnly) {
        throw new Error('Tanggal pengukuran tidak boleh melewati hari ini, Bunda. 🧡');
      }
      if (measuredDateOnly < dobDateOnly) {
        throw new Error(`Tanggal tidak boleh mendahului tanggal lahir (${activeChild.dateOfBirth}), Bunda. 🧡`);
      }

      // Duplicate date checks excluding the current record we are editing
      const records = getGrowthRecords(activeChild.id);
      const otherRecords = editId ? records.filter(r => r.id !== editId) : records;
      if (otherRecords.some(r => r.measuredAt === measuredAt)) {
        throw new Error(`Bunda sudah memiliki catatan pertumbuhan pada tanggal ${measuredAt}.`);
      }

      const recordData = {
        weightKg: w,
        heightCm: h,
        headCircCm: headCircCm ? parseFloat(headCircCm) : null,
        lila: lilaCm ? parseFloat(lilaCm) : null,
        measuredAt,
        notes: notes.trim(),
      };

      if (editId) {
        // Safe edit: delete previous then re-add
        await deleteGrowthRecord(editId);
      }

      await addGrowthRecord(activeChild.id, recordData);
      
      // Go back to growth timeline with exit animation
      handleBack();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan catatan pertumbuhan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete record
  const handleDelete = async () => {
    if (!editId) return;
    setIsSubmitting(true);
    try {
      await deleteGrowthRecord(editId);
      handleBack();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menghapus catatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (childLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 space-y-4 font-[var(--font-body)]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-text-secondary font-medium">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="relative font-[var(--font-body)]">
      {/* Animated Content Wrapper */}
      <div
        className="space-y-6 transition-all ease-out pb-44 pt-4"
        style={{
          opacity: isLeaving ? 0.3 : (mounted ? 1 : 0),
          transform: isLeaving ? 'translateX(48px)' : (mounted ? 'none' : 'translateX(32px)'),
          transitionDuration: isLeaving ? '220ms' : '400ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Form Fields sit directly on background */}
        <div className="space-y-6">
          {editId ? (
            <div className="border-b border-gray-200/60 pb-4">
              <h3 className="text-base font-bold font-[var(--font-heading)] text-gray-900 tracking-tight">
                Ubah Informasi Catatan
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Perbarui data timbangan berat dan tinggi badan {activeChild?.name || 'si kecil'}.
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 leading-relaxed">
              Catat perkembangan fisik <span className="font-semibold text-gray-700">{activeChild?.name || 'si kecil'}</span> secara berkala untuk mengevaluasi status pertumbuhannya.
            </p>
          )}
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3 bg-danger/5 border border-danger/10 text-danger text-xs font-semibold rounded-input leading-relaxed animate-shake">
            ⚠️ {errorMsg}
          </div>
        )}
 
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Weight */}
          <div className="space-y-1.5">
            <label htmlFor="weightKg" className="text-xs font-semibold text-gray-700">
              Berat Badan (kg) <span className="text-primary">*</span>
            </label>
            <input
              id="weightKg"
              type="number"
              step="0.01"
              min="1"
              max="40"
              placeholder="Contoh: 8.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
              required
            />
          </div>

          {/* Height */}
          <div className="space-y-1.5">
            <label htmlFor="heightCm" className="text-xs font-semibold text-gray-700">
              Tinggi Badan (cm) <span className="text-primary">*</span>
            </label>
            <input
              id="heightCm"
              type="number"
              step="0.1"
              min="30"
              max="130"
              placeholder="Contoh: 72.5"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
              required
            />
          </div>

          {/* Head Circumference */}
          <div className="space-y-1.5">
            <label htmlFor="headCircCm" className="text-xs font-semibold text-gray-700">
              Lingkar Kepala (cm) <span className="text-text-muted text-[10px] font-normal">(opsional)</span>
            </label>
            <input
              id="headCircCm"
              type="number"
              step="0.1"
              min="25"
              max="60"
              placeholder="Contoh: 44.0"
              value={headCircCm}
              onChange={(e) => setHeadCircCm(e.target.value)}
              className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
            />
          </div>

          {/* Upper Arm Circumference (LiLA) */}
          <div className="space-y-1.5">
            <label htmlFor="lilaCm" className="text-xs font-semibold text-gray-700">
              Lingkar Lengan Atas (LiLA) (cm) <span className="text-text-muted text-[10px] font-normal">(opsional)</span>
            </label>
            <input
              id="lilaCm"
              type="number"
              step="0.1"
              min="5"
              max="30"
              placeholder="Contoh: 12.5"
              value={lilaCm}
              onChange={(e) => setLilaCm(e.target.value)}
              className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
            />
          </div>

          {/* Date of Measurement */}
          <div className="space-y-1.5">
            <label htmlFor="measuredAt" className="text-xs font-semibold text-gray-700">
              Tanggal Pengukuran <span className="text-primary">*</span>
            </label>
            <CustomDatePicker
              id="measuredAt"
              value={measuredAt}
              onChange={(e) => setMeasuredAt(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              min={activeChild?.dateOfBirth}
              placeholder="Pilih tanggal pengukuran..."
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-gray-700">
              Catatan Perkembangan <span className="text-text-muted text-[10px] font-normal">(opsional)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Contoh: Tumbuh gigi pertama, sudah bisa merangkak dengan lancar."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out resize-none"
            />
          </div>

          {/* Sticky Actions Bottom Buttons Panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 p-4 z-40 flex flex-col gap-2">
            <div className="flex gap-3 max-w-md mx-auto w-full">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 h-[50px] border border-gray-200 rounded-button text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 hover:border-gray-300 cursor-pointer transition-all duration-200 ease-in-out active:scale-[0.98] focus:outline-none"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-[50px] rounded-button bg-primary hover:bg-primary-dark active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-primary/10 cursor-pointer transition-all duration-200 ease-in-out focus:outline-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Simpan Catatan 🧡')}
              </button>
            </div>

            {editId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full max-w-md mx-auto h-[44px] bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-button transition-all duration-200 ease-in-out active:scale-[0.98] cursor-pointer text-center focus:outline-none"
              >
                Hapus Catatan Ini
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
