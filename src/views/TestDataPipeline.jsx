import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useChild } from '../hooks/useChild';

export default function TestDataPipeline() {
  const { currentUser, register, login, logout } = useAuth();
  const { childrenList, activeChildId, setActiveChildId, addChild } = useChild();

  // Auth Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');

  // Login Form States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Child Form States
  const [childName, setChildName] = useState('');
  const [dob, setDob] = useState('');

  // JSON Raw Database Inspector state
  const [jsonText, setJsonText] = useState('{}');

  // Trigger LocalStorage string refresh
  const refreshJson = () => {
    const raw = localStorage.getItem('hayya_app_data');
    if (raw) {
      try {
        setJsonText(JSON.stringify(JSON.parse(raw), null, 2));
      } catch {
        setJsonText(raw);
      }
    } else {
      setJsonText('{"info": "hayya_app_data is empty"}');
    }
  };

  // Keep JSON inspector synchronized automatically when reactive variables change
  useEffect(() => {
    refreshJson();
  }, [currentUser, childrenList, activeChildId]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await register(phone, fullName, pin);
      alert('Registrasi Bunda berhasil! 🎉');
      setFullName('');
      setPhone('');
      setPin('');
      refreshJson();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(loginPhone, loginPin);
      alert('Login Bunda berhasil! 🔑');
      setLoginPhone('');
      setLoginPin('');
      refreshJson();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      alert('Logout Bunda berhasil! 👋');
      refreshJson();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    try {
      await addChild({
        name: childName,
        dateOfBirth: dob,
        gender: 'L',
        birthWeightKg: 3.2,
        birthHeightCm: 49,
        bloodType: 'O'
      });
      alert('Profil si Kecil berhasil ditambahkan! 👶');
      setChildName('');
      setDob('');
      refreshJson();
    } catch (err) {
      alert(`Gagal: ${err.message}`);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#C2185B' }}>🧪 Hayya App - Raw Data Pipeline Test</h1>
      <p style={{ color: '#616161' }}>
        Halaman ini dibuat khusus untuk memvalidasi reaktivitas <code>useAuth</code>, <code>useChild</code>, 
        hashing PIN, UUID generator, serta mutasi skema data offline LocalStorage secara real-time.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', margin: '20px 0' }}>
        
        {/* LEFT COLUMN: CONTROL PANEL */}
        <div>
          {/* SECTION 1: AUTHENTICATION TESTING */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#C2185B' }}>1. Fitur Testing Auth (Bunda)</h2>
            
            {!currentUser ? (
              <div>
                <form onSubmit={handleRegister} style={{ marginBottom: '20px', borderBottom: '1px dashed #ccc', paddingBottom: '15px' }}>
                  <h3>Daftar Baru (Register)</h3>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Nama Lengkap: </label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Nomor HP: </label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0812..." required />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>PIN (4 Digit): </label>
                    <input type="password" value={pin} onChange={e => setPin(e.target.value)} maxLength="4" placeholder="1234" required />
                  </div>
                  <button type="submit" style={{ background: '#C2185B', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                    Daftar Bunda 🧡
                  </button>
                </form>

                <form onSubmit={handleLogin}>
                  <h3>Masuk (Login)</h3>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Nomor HP: </label>
                    <input type="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value)} required />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>PIN (4 Digit): </label>
                    <input type="password" value={loginPin} onChange={e => setLoginPin(e.target.value)} maxLength="4" required />
                  </div>
                  <button type="submit" style={{ background: '#00897B', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                    Masuk Bunda 🔑
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ background: '#e0f2f1', padding: '10px', borderRadius: '4px' }}>
                <p>Bunda Aktif: <strong>{currentUser.fullName}</strong> ({currentUser.phone})</p>
                <p>User ID: <code>{currentUser.id}</code></p>
                <button onClick={handleLogout} style={{ background: '#C2185B', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                  Logout / Keluar 👋
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: CHILD PROFILE TESTING */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#C2185B' }}>2. Fitur Testing Profil Anak</h2>
            
            {currentUser ? (
              <div>
                <form onSubmit={handleAddChild} style={{ marginBottom: '20px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Nama Panggilan: </label>
                    <input type="text" value={childName} onChange={e => setChildName(e.target.value)} required />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Tanggal Lahir: </label>
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} required />
                  </div>
                  <button type="submit" style={{ background: '#C2185B', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                    Tambah Anak 👶
                  </button>
                </form>

                <h3 style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>Daftar Anak Terdaftar:</h3>
                {childrenList.length === 0 ? (
                  <p style={{ color: '#888', fontStyle: 'italic' }}>Belum ada data anak terdaftar untuk Bunda ini.</p>
                ) : (
                  <ul style={{ paddingLeft: '20px' }}>
                    {childrenList.map(child => (
                      <li key={child.id} style={{ marginBottom: '8px', color: activeChildId === child.id ? '#C2185B' : '#000', fontWeight: activeChildId === child.id ? 'bold' : 'normal' }}>
                        {child.name} (Lahir: {child.dateOfBirth})
                        <button 
                          onClick={() => {
                            setActiveChildId(child.id);
                            refreshJson();
                          }} 
                          style={{ marginLeft: '10px', fontSize: '11px', padding: '2px 6px', background: activeChildId === child.id ? '#C2185B' : '#ccc', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          {activeChildId === child.id ? 'Aktif ⭐' : 'Pilih'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p style={{ color: '#888', fontStyle: 'italic' }}>Silakan login/daftar sebagai Bunda terlebih dahulu untuk mengelola anak.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME JSON INSPECTOR */}
        <div>
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ margin: 0, color: '#C2185B' }}>3. Live JSON Inspector (Crucial)</h2>
              <button onClick={refreshJson} style={{ fontSize: '12px', padding: '4px 8px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                🔄 Manual Refresh
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#616161', margin: '0 0 10px 0' }}>
              Perhatikan perubahan data pada entri <code>users</code>, <code>children</code>, <code>notifications</code>, 
              serta hashing PIN dan UUID di bawah secara real-time.
            </p>
            <pre style={{
              background: '#222',
              color: '#fff',
              padding: '15px',
              borderRadius: '6px',
              fontSize: '11px',
              overflow: 'auto',
              maxHeight: '520px',
              border: '1px solid #111'
            }}>
              {jsonText}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}
