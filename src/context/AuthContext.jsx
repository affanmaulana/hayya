import React, { createContext, useState } from 'react';
import { hashPin } from '../utils/cryptoUtils.js';
import { getCollection, insertItem, updateItem } from '../utils/localStorageUtils.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const activeUserId = localStorage.getItem('hayya_active_user_id');
      if (activeUserId) {
        const users = getCollection('users');
        const user = users.find(u => u.id === activeUserId && u.isActive !== false);
        return user || null;
      }
    } catch (error) {
      console.error('Error initializing current user:', error);
    }
    return null;
  });

  const isAuthenticated = !!currentUser;

  /**
   * Registers a new user.
   * 
   * @param {string} phone - User phone number (digits only, min 10 digits).
   * @param {string} fullName - Full name of the user.
   * @param {string} pin - 4-digit PIN.
   * @param {Object} [domisili] - Domisili data containing { district, regency, province }.
   * @returns {Promise<Object>} Created user object.
   */
  const register = async (phone, fullName, pin, domisili) => {
    // 1. Validations
    if (!phone) {
      throw new Error("Nomor HP tidak boleh kosong ya, Bunda. 🧡");
    }
    const cleanPhone = phone.replace(/\D/g, ''); // keep only digits
    if (cleanPhone.length < 10) {
      throw new Error("Nomor HP tidak valid. Harus minimal 10 digit ya, Bunda. 🧡");
    }

    if (!fullName || fullName.trim() === '') {
      throw new Error("Nama Lengkap tidak boleh kosong ya, Bunda. 🧡");
    }

    if (!pin) {
      throw new Error("PIN tidak boleh kosong ya, Bunda. 🔑");
    }
    if (!/^\d{4}$/.test(pin)) {
      throw new Error("PIN harus berupa 4 digit angka ya, Bunda. 🔑");
    }

    // 2. Check for duplicates
    const users = getCollection('users');
    const duplicate = users.find(u => u.phone === cleanPhone && u.isActive !== false);
    if (duplicate) {
      throw new Error("Nomor HP sudah terdaftar, Bunda. Silakan langsung masuk atau gunakan nomor lain. 🧡");
    }

    // 3. Hash PIN
    const pinHash = await hashPin(pin);

    // 4. Create user object
    const newUser = {
      phone: cleanPhone,
      fullName: fullName.trim(),
      pinHash,
      profilePhoto: '',
      district: domisili && typeof domisili === 'object' ? (domisili.district || '') : '',
      regency: domisili && typeof domisili === 'object' ? (domisili.regency || '') : '',
      province: domisili && typeof domisili === 'object' ? (domisili.province || '') : '',
      isActive: true,
      lastLoginAt: new Date().toISOString()
    };

    // 5. Save to LocalStorage using standard utils
    const createdUser = insertItem('users', newUser);

    // 6. Auto-login the user
    localStorage.setItem('hayya_active_user_id', createdUser.id);
    setCurrentUser(createdUser);

    return createdUser;
  };

  /**
   * Logs in a user.
   * 
   * @param {string} phone - User phone number.
   * @param {string} pin - 4-digit PIN.
   * @returns {Promise<Object>} Logged-in user object.
   */
  const login = async (phone, pin) => {
    // 1. Validations
    if (!phone) {
      throw new Error("Nomor HP tidak boleh kosong ya, Bunda. 🧡");
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      throw new Error("Nomor HP tidak valid. Harus minimal 10 digit ya, Bunda. 🧡");
    }

    if (!pin) {
      throw new Error("PIN tidak boleh kosong ya, Bunda. 🔑");
    }
    if (!/^\d{4}$/.test(pin)) {
      throw new Error("PIN harus berupa 4 digit angka ya, Bunda. 🔑");
    }

    // 3. Hash PIN
    const pinHash = await hashPin(pin);

    // 4. Retrieve and match credentials
    const users = getCollection('users');
    const user = users.find(u => u.phone === cleanPhone && u.isActive !== false);

    if (!user || user.pinHash !== pinHash) {
      throw new Error("Nomor HP atau PIN salah, Bunda. Silakan periksa kembali. 🧡");
    }

    // 5. Update lastLoginAt
    const updatedUser = updateItem('users', user.id, {
      lastLoginAt: new Date().toISOString()
    });

    // 6. Establish session
    localStorage.setItem('hayya_active_user_id', updatedUser.id);
    setCurrentUser(updatedUser);

    return updatedUser;
  };

  /**
   * Logs out the currently active user.
   */
  const logout = async () => {
    localStorage.removeItem('hayya_active_user_id');
    setCurrentUser(null);
  };

  /**
   * Updates the profile of the current logged-in user.
   * 
   * @param {Object} updates - Fields to update.
   * @returns {Promise<Object>} Updated user object.
   */
  const updateProfile = async (updates) => {
    if (!currentUser) {
      throw new Error("Tidak ada pengguna aktif, Bunda. Silakan masuk terlebih dahulu.");
    }

    // Validate updates
    if (updates.hasOwnProperty('fullName') && (!updates.fullName || updates.fullName.trim() === '')) {
      throw new Error("Nama Lengkap tidak boleh kosong ya, Bunda. 🧡");
    }

    // If new PIN is provided
    let finalUpdates = { ...updates };
    if (updates.pin) {
      if (!/^\d{4}$/.test(updates.pin)) {
        throw new Error("PIN baru harus berupa 4 digit angka ya, Bunda. 🔑");
      }
      finalUpdates.pinHash = await hashPin(updates.pin);
      delete finalUpdates.pin;
    }

    // Clean phone if provided (though phone is typically read-only, ensure standard formatting if it is updated)
    if (updates.phone) {
      const cleanPhone = updates.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        throw new Error("Nomor HP tidak valid. Harus minimal 10 digit ya, Bunda. 🧡");
      }
      finalUpdates.phone = cleanPhone;
    }

    // Save to LocalStorage
    const updatedUser = updateItem('users', currentUser.id, finalUpdates);
    if (!updatedUser) {
      throw new Error("Gagal memperbarui profil. Pengguna tidak ditemukan.");
    }

    // Update state
    setCurrentUser(updatedUser);

    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        register,
        login,
        logout,
        updateProfile,
        setCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
