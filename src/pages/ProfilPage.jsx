import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { useChildContext } from '../context/ChildContext.jsx';

/**
 * ProfilPage — Profile and settings manager (Lainnya tab).
 * Designed with premium glassmorphism, glowing accents, and elegant child quick-switcher.
 */
export default function ProfilPage() {
  const { currentUser } = useContext(AuthContext);
  const { childrenList } = useChildContext();
  const navigate = useNavigate();

  // Extract first name
  const firstName = currentUser?.fullName?.split(' ')[0] || 'Bunda';

  return (
    <div className="space-y-6 font-[var(--font-body)] animate-fade-in pb-10 pt-2">
      
      {/* Premium Profile Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/[0.02] to-transparent rounded-card border border-primary/10 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        {/* Glow Effects */}
        <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-secondary/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col gap-2">
          {/* Main User Info */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2.5px] shadow-[0_4px_12px_rgba(194,24,91,0.15)] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <span className="text-2xl text-primary font-black font-[var(--font-heading)]">
                    {currentUser?.fullName?.charAt(0)?.toUpperCase() || 'B'}
                  </span>
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-success border-2 border-white flex items-center justify-center text-[10px] shadow-sm" title="Online">
                ✓
              </span>
            </div>
            
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black font-[var(--font-heading)] text-gray-900 truncate">
                  {currentUser?.fullName || 'Bunda'}
                </h3>
              </div>
              <p className="text-xs text-gray-500 font-medium">{currentUser?.phone || '-'}</p>
              
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 text-[9px] font-bold bg-secondary/10 border border-secondary/10 text-primary-light rounded-full uppercase tracking-wider">
                  Bundaku Siaga 💖
                </span>
              </div>
            </div>
          </div>

          <div className="h-px bg-primary/5 w-full" />

          {/* User Quick Stats */}
          <div className="w-full">
            <div className="bg-white/60 backdrop-blur-xs rounded-xl p-3 border border-white/80 shadow-xs flex flex-col justify-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Anak Terdaftar
              </span>
              <span className="text-lg font-black font-[var(--font-heading)] text-gray-800 mt-0.5">
                {childrenList.length} Anak
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Layanan Utama & Fitur Pintar */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 px-1 font-[var(--font-heading)]">
          Layanan & Fitur Pintar
        </h4>
        
        <div className="grid grid-cols-1 gap-3">
          {[
            {
              icon: '🩺',
              iconBg: 'bg-teal-50 text-teal-600',
              label: 'Cek Gejala Si Kecil',
              desc: 'Identifikasi dini keluhan dan gejala penyakit anak secara akurat.',
              badge: 'AI Smart ✨',
              onClick: () => navigate('/dashboard/profil/cek-gejala'),
            },
            {
              icon: '📚',
              iconBg: 'bg-amber-50 text-amber-600',
              label: 'Edukasi & Artikel Ibu',
              desc: 'Koleksi artikel terpercaya seputar tumbuh kembang, ASI, dan MPASI.',
              badge: 'Populer 🌿',
              onClick: () => navigate('/dashboard/profil/edukasi'),
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="w-full bg-white border border-gray-100 hover:border-gray-200 rounded-card p-4 flex items-start gap-4 transition-all duration-200 hover:shadow-card-hover cursor-pointer text-left focus:outline-none relative group"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${item.iconBg}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-bold text-gray-900 font-[var(--font-heading)] leading-none">
                    {item.label}
                  </h5>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[8px] font-extrabold bg-primary/5 text-primary rounded-md uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-300 absolute right-4 top-1/2 -translate-y-1/2 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Section: Pengaturan Akun */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 px-1 font-[var(--font-heading)]">
          Pengaturan Akun & Data
        </h4>
        
        <div className="bg-white border border-gray-100 rounded-card overflow-hidden divide-y divide-gray-50 shadow-xs">
          {[
            {
              icon: '👶',
              label: 'Kelola Data Anak',
              desc: 'Tambah profil baru atau ubah detail tinggi & berat lahir.',
              onClick: () => navigate('/dashboard/profil/anak'),
            },
            {
              icon: '✏️',
              label: 'Ubah Profil Bunda',
              desc: 'Perbarui nama lengkap, nomor WhatsApp, dan akun sandi.',
              onClick: () => navigate('/dashboard/profil/edit'),
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="w-full flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors duration-150 cursor-pointer text-left focus:outline-none relative group"
            >
              <span className="text-lg bg-gray-50 p-2 rounded-xl shrink-0 group-hover:bg-primary/5 transition-colors">{item.icon}</span>
              <div className="flex-1 min-w-0 pr-6">
                <h5 className="text-sm font-bold text-gray-800 font-[var(--font-heading)] leading-none">
                  {item.label}
                </h5>
                <p className="text-xs text-gray-400 mt-1.5 font-medium leading-tight">
                  {item.desc}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-300 absolute right-5 top-1/2 -translate-y-1/2 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Account actions */}
      <div className="space-y-4 pt-2">
        {/* Footer info */}
        <div className="text-center space-y-1">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Hayya Parenting App
          </p>
          <p className="text-[9px] text-gray-400 font-medium">
            Versi 1.0.0 (Premium Release) • Dibuat dengan 🧡 untuk Bunda hebat
          </p>
        </div>
      </div>

    </div>
  );
}
