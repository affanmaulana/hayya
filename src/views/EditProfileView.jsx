import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

export default function EditProfileView({ onBack }) {
  const { currentUser, updateProfile, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/dashboard/profil');
  };

  // Edit Profil Form States
  const [nameInput, setNameInput] = useState(currentUser?.fullName || '');
  const [phoneInput, setPhoneInput] = useState(currentUser?.phone || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!nameInput.trim()) {
      setErrorMsg("Nama Lengkap tidak boleh kosong ya, Bunda. 🧡");
      return;
    }
    if (!phoneInput.trim()) {
      setErrorMsg("Nomor HP tidak boleh kosong ya, Bunda. 🧡");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        fullName: nameInput.trim(),
        phone: phoneInput.trim()
      });
      setSuccessMsg("Profil Bunda berhasil diperbarui! 🧡");
      setTimeout(() => {
        handleBack();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || "Gagal memperbarui profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-[var(--font-body)] animate-fade-in pb-10">

      {/* Profile Form Card */}
      <div className="bg-white rounded-card border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-6 space-y-6 hover:shadow-[0_6px_16px_rgba(0,0,0,0.04)] transition-all duration-200 ease-in-out">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-base font-bold font-[var(--font-heading)] text-gray-900 tracking-tight">
            Ubah Informasi Akun
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Perbarui nama lengkap dan nomor HP aktif Bunda yang terdaftar di aplikasi.
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 bg-danger/5 border border-danger/10 text-danger text-xs font-semibold rounded-input leading-relaxed animate-shake">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div className="p-3 bg-success/5 border border-success/10 text-success text-xs font-semibold rounded-input leading-relaxed">
            🎉 {successMsg}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="name-input" className="text-xs font-semibold text-gray-700">
              Nama Lengkap Bunda <span className="text-primary">*</span>
            </label>
            <input
              id="name-input"
              type="text"
              placeholder="Contoh: Bunda Fia"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label htmlFor="phone-input" className="text-xs font-semibold text-gray-700">
              Nomor HP Aktif <span className="text-primary">*</span>
            </label>
            <input
              id="phone-input"
              type="text"
              placeholder="Contoh: 08123123123"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full h-11 px-4 border border-gray-200 rounded-input text-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all duration-200 ease-in-out"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 h-[52px] border border-gray-200 rounded-button text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50/50 hover:border-gray-300 cursor-pointer transition-all duration-200 ease-in-out active:scale-[0.98] focus:outline-none"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-[52px] rounded-button bg-primary hover:bg-primary-dark active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-primary/10 cursor-pointer transition-all duration-200 ease-in-out focus:outline-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan 🧡'}
            </button>
          </div>
        </form>
      </div>

      {/* Account actions - Keluar Akun */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full h-12 rounded-button border-2 border-danger/20 text-danger text-xs font-black font-[var(--font-heading)] hover:bg-danger/5 hover:border-danger/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 focus:outline-none active:scale-[0.98] shadow-xs"
        >
          <span>🚪</span> Keluar dari Akun
        </button>
      </div>

    </div>
  );
}
