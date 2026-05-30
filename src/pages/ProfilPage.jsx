import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useChildContext } from '../context/ChildContext.jsx';
import ManageChildrenView from '../views/ManageChildrenView.jsx';
import EducationView from '../views/EducationView.jsx';
import SymptomCheckView from '../views/SymptomCheckView.jsx';
import EditProfileView from '../views/EditProfileView.jsx';

/**
 * ProfilPage — Profile and settings manager (Lainnya tab).
 */
export default function ProfilPage() {
  const { currentUser, logout } = useContext(AuthContext);
  const { childrenList } = useChildContext();
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'manage-children', 'education', 'symptom-check', or 'edit-profile'

  if (currentView === 'edit-profile') {
    return <EditProfileView onBack={() => setCurrentView('menu')} />;
  }

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
          { icon: '✏️', label: 'Edit Profil', onClick: () => setCurrentView('edit-profile') },
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
    </div>
  );
}

