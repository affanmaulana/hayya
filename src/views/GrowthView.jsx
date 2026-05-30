import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGrowth } from '../hooks/useGrowth';
import { useChild } from '../hooks/useChild';
import { formatDate } from '../utils/dateHelpers';

export default function GrowthView() {
  const navigate = useNavigate();
  const { activeChild, isLoading } = useChild();
  const { getGrowthRecords, addGrowthRecord } = useGrowth();

  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCircCm, setHeadCircCm] = useState('');
  const [measuredAt, setMeasuredAt] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    // existing submit logic
    
    e.preventDefault();
    setError('');
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
      await addGrowthRecord(activeChild.id, record);
      // clear form
      setWeightKg('');
      setHeightCm('');
      setHeadCircCm('');
      setMeasuredAt('');
      setNotes('');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan catatan pertumbuhan.');
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
  }, [activeChild?.id]);

  return (
    <div className="space-y-6 font-[var(--font-body)] p-4">
      <h2 className="text-xl font-bold font-[var(--font-heading)] text-text">Catatan Pertumbuhan {activeChild?.name}</h2>
      {error && (
        <div className="p-3 bg-danger/5 border border-danger/10 text-danger text-sm rounded-input animate-shake">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 max-w-md">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text" htmlFor="weightKg">Berat (kg) *</label>
          <input
            id="weightKg"
            type="number"
            step="0.01"
            min="1"
            max="40"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            required
            className="w-full h-11 px-4 border border-border rounded-input text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text" htmlFor="heightCm">Tinggi (cm) *</label>
          <input
            id="heightCm"
            type="number"
            step="0.1"
            min="30"
            max="130"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            required
            className="w-full h-11 px-4 border border-border rounded-input text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text" htmlFor="headCircCm">Lingkar Kepala (cm) (opsional)</label>
          <input
            id="headCircCm"
            type="number"
            step="0.1"
            min="25"
            max="60"
            value={headCircCm}
            onChange={(e) => setHeadCircCm(e.target.value)}
            className="w-full h-11 px-4 border border-border rounded-input text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text" htmlFor="measuredAt">Tanggal Pengukuran *</label>
          <input
            id="measuredAt"
            type="date"
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            required
            className="w-full h-11 px-4 border border-border rounded-input text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors cursor-pointer"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text" htmlFor="notes">Catatan (opsional)</label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-input text-sm bg-bg-card focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-[48px] rounded-button bg-primary text-white font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Catatan'}
        </button>
      </form>

      {/* Table of records */}
      {records.length > 0 && (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full bg-white border border-border rounded-card shadow-card">
            <thead className="bg-bg-card">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted">Tanggal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted">Berat (kg)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted">Tinggi (cm)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted">Lingkar Kepala (cm)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t border-border/30">
                  <td className="px-4 py-2 text-sm text-text">{formatDate(r.measuredAt)}</td>
                  <td className="px-4 py-2 text-sm text-text">{r.weightKg}</td>
                  <td className="px-4 py-2 text-sm text-text">{r.heightCm}</td>
                  <td className="px-4 py-2 text-sm text-text">{r.headCircCm ?? '-'}
</td>
                  <td className="px-4 py-2 text-sm text-text-muted">{r.notes || '-'}
</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
