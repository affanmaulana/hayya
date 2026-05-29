import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

/**
 * Custom hook to consume the AuthContext.
 * Exposes: currentUser, isAuthenticated, register, login, logout, updateProfile.
 */
export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider. Make sure you wrap your App or index with <AuthProvider>.');
  }
  return context;
}
