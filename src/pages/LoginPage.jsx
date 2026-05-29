import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';

/**
 * LoginPage — Minimal login form (Phone + PIN).
 * Full implementation comes later; this is a functional placeholder
 * that connects to AuthContext.login().
 */
export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, pin);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-[380px] space-y-8">
        {/* Logo / Brand */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
            <span className="text-3xl text-white font-extrabold font-[var(--font-heading)]">H</span>
          </div>
          <h1 className="text-2xl font-extrabold font-[var(--font-heading)] text-text">
            Hayya
          </h1>
          <p className="text-sm text-text-secondary mt-1 font-[var(--font-body)]">
            Teman digital Bunda 🧡
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm px-4 py-3 rounded-(--radius-input) border border-danger/20" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="login-phone" className="text-sm font-medium text-text font-[var(--font-body)]">
              Nomor HP
            </label>
            <input
              id="login-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full px-4 py-3 rounded-(--radius-input) border border-border bg-white text-text text-sm font-[var(--font-body)] placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[48px]"
              autoComplete="tel"
              inputMode="numeric"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-pin" className="text-sm font-medium text-text font-[var(--font-body)]">
              PIN (4 digit)
            </label>
            <input
              id="login-pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={4}
              className="w-full px-4 py-3 rounded-(--radius-input) border border-border bg-white text-text text-sm font-[var(--font-body)] placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[48px] tracking-[0.5em] text-center"
              autoComplete="current-password"
              inputMode="numeric"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-(--radius-button) bg-gradient-to-r from-secondary to-primary text-white text-sm font-bold font-[var(--font-heading)] shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[52px]"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-sm text-text-secondary font-[var(--font-body)]">
          Belum punya akun?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
