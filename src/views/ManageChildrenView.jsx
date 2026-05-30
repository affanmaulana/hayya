import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChild } from '../hooks/useChild';
import { formatDate } from '../utils/dateHelpers';

export default function ManageChildrenView({ onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/dashboard/profil');
  };

  const { 
    childrenList, 
    activeChildId, 
    setActiveChildId, 
    addChild, 
    updateChild 
  } = useChild();

  // Modals visibility states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Active child being edited
  const [editingChild, setEditingChild] = useState(null);

  // Shared form states
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('L');
  const [birthWeight, setBirthWeight] = useState('');
  const [birthHeight, setBirthHeight] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Maximum allowed date for date of birth (today)
  const maxDobString = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Open edit modal and populate state
  const openEditModal = (child) => {
    setEditingChild(child);
    setName(child.name || '');
    setDateOfBirth(child.dateOfBirth || '');
    setGender(child.gender || 'L');
    setBirthWeight(child.birthWeightKg || '');
    setBirthHeight(child.birthHeightCm || '');
    setBloodType(child.bloodType || '');
    setFormError('');
    setIsEditOpen(true);
  };

  // Open add modal and clear state
  const openAddModal = () => {
    setName('');
    setDateOfBirth('');
    setGender('L');
    setBirthWeight('');
    setBirthHeight('');
    setBloodType('');
    setFormError('');
    setIsAddOpen(true);
  };

  // Handle edit child submission
  const handleEditSubmit = (e) => {
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
      if (birthWeight && parseFloat(birthWeight) <= 0) {
        throw new Error('Berat lahir harus berupa angka positif, Bunda. 🧡');
      }
      if (birthHeight && parseFloat(birthHeight) <= 0) {
        throw new Error('Tinggi lahir harus berupa angka positif, Bunda. 🧡');
      }

      updateChild(editingChild.id, {
        name: name.trim(),
        dateOfBirth,
        gender,
        birthWeightKg: birthWeight ? parseFloat(birthWeight) : null,
        birthHeightCm: birthHeight ? parseFloat(birthHeight) : null,
        bloodType: bloodType || '',
        updatedAt: new Date().toISOString()
      });

      setIsEditOpen(false);
      setEditingChild(null);
    } catch (err) {
      setFormError(err.message || 'Gagal mengubah profil anak.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle add child submission
  const handleAddSubmit = (e) => {
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

      addChild({
        name: name.trim(),
        dateOfBirth,
        gender,
        birthWeightKg: parseFloat(birthWeight),
        birthHeightCm: parseFloat(birthHeight),
        bloodType: bloodType || '',
        photoUrl: ''
      });

      setIsAddOpen(false);
    } catch (err) {
      setFormError(err.message || 'Gagal menambahkan profil anak.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-[var(--font-body)] animate-fade-in pb-10">

      {/* Children list */}
      <div className="space-y-4">
        {childrenList.length === 0 ? (
          <div className="bg-white rounded-card border border-gray-100 p-6 text-center text-sm text-gray-500 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            Bunda belum mendaftarkan profil anak. Klik tombol di bawah untuk mendaftarkan si kecil! 🧡
          </div>
        ) : (
          childrenList.map((child) => {
            const isActive = child.id === activeChildId;
            return (
              <div
                key={child.id}
                onClick={() => setActiveChildId(child.id)}
                className={`bg-white rounded-card border p-5 flex items-center gap-4 relative group cursor-pointer transition-all duration-200 ease-in-out ${
                  isActive 
                    ? 'border-accent shadow-[0_4px_12px_rgba(240,140,82,0.08)]' 
                    : 'border-gray-100 hover:border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)]'
                }`}
              >
                {/* Avatar Icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                  child.gender === 'L'
                    ? 'bg-accent/10 border-accent/15 text-accent'
                    : 'bg-primary/10 border-primary/15 text-primary'
                }`}>
                  {child.name ? child.name.charAt(0).toUpperCase() : '👶'}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-[var(--font-heading)] text-gray-900 truncate">
                      {child.name}
                    </h3>
                    {isActive && (
                      <span className="px-2 py-0.5 text-[9px] font-extrabold bg-accent/10 border border-accent/15 text-accent rounded-full uppercase tracking-wider">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Lahir: {formatDate(child.dateOfBirth)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                    {child.gender === 'L' ? '👦 Laki-laki' : '👧 Perempuan'} • {child.birthWeightKg} kg • {child.birthHeightCm} cm
                  </p>
                </div>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid switching active child when clicking edit
                    openEditModal(child);
                  }}
                  className="px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200 text-[11px] font-bold text-primary font-[var(--font-heading)] hover:text-primary-dark transition-all duration-200 ease-in-out cursor-pointer active:scale-95 focus:outline-none"
                >
                  Edit
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Child Button */}
      <button
        onClick={openAddModal}
        className="w-full h-[52px] rounded-button border-2 border-dashed border-primary text-primary hover:border-primary-dark hover:text-primary-dark hover:bg-primary/5 transition-all duration-200 ease-in-out text-sm font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] focus:outline-none"
      >
        <span>+</span> Tambah Anak Baru
      </button>

      {/* ===== EDIT MODAL ===== */}
      {isEditOpen && editingChild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsEditOpen(false)}
          />

          <div className="bg-white rounded-card border border-gray-100 w-full max-w-[360px] shadow-2xl relative z-10 overflow-hidden font-[var(--font-body)] animate-scale-up">
            <div className="bg-primary/5 border-b border-gray-100 px-5 py-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest font-[var(--font-heading)]">Ubah Profil</span>
                <h3 className="text-sm font-extrabold font-[var(--font-heading)] text-gray-900 mt-0.5">
                  {editingChild.name}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 cursor-pointer font-bold text-base focus:outline-none active:scale-90"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 max-h-[75dvh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-danger/5 border border-danger/10 text-danger text-xs font-semibold rounded-input leading-relaxed animate-shake">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="edit-name" className="text-xs font-semibold text-gray-700">
                  Nama Panggilan *
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Rayyan"
                  required
                  className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label htmlFor="edit-dob" className="text-xs font-semibold text-gray-700">
                  Tanggal Lahir *
                </label>
                <input
                  id="edit-dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={maxDobString}
                  required
                  className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out cursor-pointer"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-700">Jenis Kelamin *</span>
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

              {/* Weight & Height Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="edit-weight" className="text-xs font-semibold text-gray-700">
                    Berat Lahir (kg)
                  </label>
                  <input
                    id="edit-weight"
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="15"
                    value={birthWeight}
                    onChange={(e) => setBirthWeight(e.target.value)}
                    className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="edit-height" className="text-xs font-semibold text-gray-700">
                    Tinggi Lahir (cm)
                  </label>
                  <input
                    id="edit-height"
                    type="number"
                    step="0.1"
                    min="10"
                    max="100"
                    value={birthHeight}
                    onChange={(e) => setBirthHeight(e.target.value)}
                    className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
                  />
                </div>
              </div>

              {/* Blood Type */}
              <div className="space-y-1.5">
                <label htmlFor="edit-blood" className="text-xs font-semibold text-gray-700">
                  Golongan Darah
                </label>
                <select
                  id="edit-blood"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out cursor-pointer"
                >
                  <option value="">Pilih...</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 h-11 border border-gray-200 rounded-button text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 hover:border-gray-300 cursor-pointer focus:outline-none transition-all duration-200 ease-in-out active:scale-[0.98]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 rounded-button bg-primary hover:bg-primary-dark active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-primary/10 cursor-pointer focus:outline-none transition-all duration-200 ease-in-out"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== ADD MODAL ===== */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsAddOpen(false)}
          />

          <div className="bg-white rounded-card border border-gray-100 w-full max-w-[360px] shadow-2xl relative z-10 overflow-hidden font-[var(--font-body)] animate-scale-up">
            <div className="bg-primary/5 border-b border-gray-100 px-5 py-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest font-[var(--font-heading)]">Pendaftaran Anak</span>
                <h3 className="text-sm font-extrabold font-[var(--font-heading)] text-gray-900 mt-0.5">
                  Profil Baru
                </h3>
              </div>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 cursor-pointer font-bold text-base focus:outline-none active:scale-90"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 max-h-[75dvh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-danger/5 border border-danger/10 text-danger text-xs font-semibold rounded-input leading-relaxed animate-shake">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="add-name" className="text-xs font-semibold text-gray-700">
                  Nama Panggilan *
                </label>
                <input
                  id="add-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Rayyan"
                  required
                  className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label htmlFor="add-dob" className="text-xs font-semibold text-gray-700">
                  Tanggal Lahir *
                </label>
                <input
                  id="add-dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  max={maxDobString}
                  required
                  className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out cursor-pointer"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-700">Jenis Kelamin *</span>
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

              {/* Weight & Height Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="add-weight" className="text-xs font-semibold text-gray-700">
                    Berat Lahir (kg) *
                  </label>
                  <input
                    id="add-weight"
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="15"
                    value={birthWeight}
                    onChange={(e) => setBirthWeight(e.target.value)}
                    required
                    className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="add-height" className="text-xs font-semibold text-gray-700">
                    Tinggi Lahir (cm) *
                  </label>
                  <input
                    id="add-height"
                    type="number"
                    step="0.1"
                    min="10"
                    max="100"
                    value={birthHeight}
                    onChange={(e) => setBirthHeight(e.target.value)}
                    required
                    className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
                  />
                </div>
              </div>

              {/* Blood Type */}
              <div className="space-y-1.5">
                <label htmlFor="add-blood" className="text-xs font-semibold text-gray-700">
                  Golongan Darah
                </label>
                <select
                  id="add-blood"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out cursor-pointer"
                >
                  <option value="">Pilih...</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 h-11 border border-gray-200 rounded-button text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 hover:border-gray-300 cursor-pointer focus:outline-none transition-all duration-200 ease-in-out active:scale-[0.98]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 rounded-button bg-primary hover:bg-primary-dark active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-primary/10 cursor-pointer focus:outline-none transition-all duration-200 ease-in-out"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Daftarkan Anak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
