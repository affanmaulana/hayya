import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';

/**
 * RegisterPage — Minimal registration form.
 * Connects to AuthContext.register() for immediate account creation.
 */
export default function RegisterPage() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side PIN confirmation
    if (pin !== pinConfirm) {
      setError('PIN dan konfirmasi PIN tidak sama, Bunda. 🔑');
      return;
    }

    setLoading(true);
    try {
      await register(phone, fullName, pin);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-[380px] space-y-8">
        {/* Brand */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3">
            <span className="text-2xl text-white font-extrabold font-[var(--font-heading)]">H</span>
          </div>
          <h1 className="text-xl font-extrabold font-[var(--font-heading)] text-text">
            Daftar Akun Hayya
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-[var(--font-body)]">
            Yuk, mulai perjalanan Bunda bersama si kecil 🧡
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-(--radius-input) border border-danger/20" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="register-name" className="text-sm font-medium text-text font-[var(--font-body)]">
              Nama Lengkap Bunda
            </label>
            <input
              id="register-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className="w-full px-4 py-3 rounded-(--radius-input) border border-border bg-white text-text text-sm font-[var(--font-body)] placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[48px]"
              autoComplete="name"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="register-phone" className="text-sm font-medium text-text font-[var(--font-body)]">
              Nomor HP
            </label>
            <input
              id="register-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full px-4 py-3 rounded-(--radius-input) border border-border bg-white text-text text-sm font-[var(--font-body)] placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[48px]"
              autoComplete="tel"
              inputMode="numeric"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="register-pin" className="text-sm font-medium text-text font-[var(--font-body)]">
                PIN (4 digit)
              </label>
              <input
                id="register-pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                maxLength={4}
                className="w-full px-4 py-3 rounded-(--radius-input) border border-border bg-white text-text text-sm font-[var(--font-body)] placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[48px] tracking-[0.5em] text-center"
                autoComplete="new-password"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="register-pin-confirm" className="text-sm font-medium text-text font-[var(--font-body)]">
                Ulangi PIN
              </label>
              <input
                id="register-pin-confirm"
                type="password"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value)}
                placeholder="••••"
                maxLength={4}
                className="w-full px-4 py-3 rounded-(--radius-input) border border-border bg-white text-text text-sm font-[var(--font-body)] placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[48px] tracking-[0.5em] text-center"
                autoComplete="new-password"
                inputMode="numeric"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-(--radius-button) bg-gradient-to-r from-secondary to-primary text-white text-sm font-bold font-[var(--font-heading)] shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[52px]"
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang 🌟'}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-text-secondary font-[var(--font-body)]">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
