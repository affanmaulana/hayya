import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useChildContext } from '../context/ChildContext.jsx';
import ManageChildrenView from '../views/ManageChildrenView.jsx';
import EducationView from '../views/EducationView.jsx';
import SymptomCheckView from '../views/SymptomCheckView.jsx';

/**
 * ProfilPage — Profile and settings manager (Lainnya tab).
 */
export default function ProfilPage() {
  const { currentUser, logout, updateProfile } = useContext(AuthContext);
  const { childrenList } = useChildContext();
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'manage-children', 'education', or 'symptom-check'

  // Edit Profil Form States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenEditProfile = () => {
    setNameInput(currentUser?.fullName || '');
    setPhoneInput(currentUser?.phone || '');
    setErrorMsg('');
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setErrorMsg("Nama Lengkap tidak boleh kosong ya, Bunda. 🧡");
      return;
    }
    if (!phoneInput.trim()) {
      setErrorMsg("Nomor HP tidak boleh kosong ya, Bunda. 🧡");
      return;
    }
    try {
      await updateProfile({
        fullName: nameInput.trim(),
        phone: phoneInput.trim()
      });
      setIsEditProfileOpen(false);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err.message || "Gagal memperbarui profil.");
    }
  };

  if (currentView === 'manage-children') {
    return <ManageChildrenView onBack={() => setCurrentView('menu')} />;
  }

  if (currentView === 'education') {
    return <EducationView onBack={() => setCurrentView('menu')} />;
  }

  if (currentView === 'symptom-check') {
    return <SymptomCheckView onBack={() => setCurrentView('menu')} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold font-[var(--font-heading)] text-text">
          Profil Bunda 👩‍👧
        </h2>
      </div>

      {/* Profile Card */}
      <div className="bg-bg-card rounded-card p-5 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shrink-0">
            <span className="text-xl text-white font-bold font-[var(--font-heading)]">
              {currentUser?.fullName?.charAt(0)?.toUpperCase() || 'B'}
            </span>
          </div>
          <div>
            <h3 className="text-base font-bold font-[var(--font-heading)] text-text">
              {currentUser?.fullName || 'Bunda'}
            </h3>
            <p className="text-sm text-text-secondary">{currentUser?.phone || '-'}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {childrenList.length} anak terdaftar
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-bg-card rounded-card shadow-card overflow-hidden divide-y divide-border">
        {[
          { icon: '✏️', label: 'Edit Profil', onClick: () => handleOpenEditProfile() },
          { icon: '👶', label: 'Kelola Data Anak', onClick: () => setCurrentView('manage-children') },
          { icon: '📚', label: 'Edukasi & Artikel', onClick: () => setCurrentView('education') },
          { icon: '🩺', label: 'Cek Gejala', onClick: () => setCurrentView('symptom-check') },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.onClick || (() => {})}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-bg transition-colors duration-150 cursor-pointer min-h-[48px] focus:outline-none text-left"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm font-medium text-text font-[var(--font-body)]">{item.label}</span>
            <svg className="w-4 h-4 text-text-muted ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 rounded-button border-2 border-danger/30 text-danger text-sm font-semibold font-[var(--font-heading)] hover:bg-danger/5 transition-colors duration-200 cursor-pointer min-h-[48px] focus:outline-none"
      >
        Keluar Akun
      </button>

      {/* ===== EDIT PROFIL MODAL ===== */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[380px] bg-white rounded-card border border-border p-6 shadow-xl space-y-4 animate-scale-up font-[var(--font-body)]">
            
            {/* Modal Title */}
            <div className="border-b border-border/50 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-extrabold font-[var(--font-heading)] text-text">
                Edit Profil Bunda ✏️
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-text-muted hover:text-text cursor-pointer p-1 -mr-1"
                aria-label="Tutup"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <p className="text-[11px] text-danger font-semibold bg-danger/5 p-2.5 rounded-lg border border-danger/10">
                ⚠️ {errorMsg}
              </p>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-text-secondary block">Nama Lengkap Bunda</label>
                <input
                  type="text"
                  placeholder="Contoh: Fia"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border focus:border-primary focus:outline-none bg-white font-medium text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-text-secondary block">Nomor HP Aktif</label>
                <input
                  type="text"
                  placeholder="Contoh: 08123123123"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-border focus:border-primary focus:outline-none bg-white font-medium text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 h-11 rounded-button border border-border text-text-secondary font-bold hover:bg-bg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-button bg-primary hover:bg-primary-dark text-white font-bold shadow-md shadow-primary/10 transition-colors cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

