import { useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { seedAllData } from './utils/seedData';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ChildProvider } from './context/ChildContext';
import { MilestonesProvider } from './context/MilestonesContext';
import { ImmunizationProvider } from './context/ImmunizationContext';
import { MpasiProvider } from './context/MpasiContext';
import { SymptomCheckProvider } from './context/SymptomCheckContext';

// Layout
import AppLayout from './components/Layout/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardView from './views/DashboardView';
import GrowthView from './views/GrowthView';
import MpasiPage from './pages/MpasiPage';
import ImunisasiPage from './pages/ImunisasiPage';
import ProfilPage from './pages/ProfilPage';

/**
 * ProtectedRoute — Redirects to /login if no active session.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * PublicRoute — Redirects authenticated users to /dashboard.
 */
function PublicRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

/**
 * AppRoutes — Separated so it can consume AuthContext.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected dashboard routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardView />} />
        <Route path="growth" element={<GrowthView />} />
        <Route path="mpasi" element={<MpasiPage />} />
        <Route path="imunisasi" element={<ImunisasiPage />} />
        <Route path="profil" element={<ProfilPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  // Trigger data seeding once on app mount
  useEffect(() => {
    seedAllData();
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ChildProvider>
          <MilestonesProvider>
            <ImmunizationProvider>
              <MpasiProvider>
                <SymptomCheckProvider>
                  <AppRoutes />
                </SymptomCheckProvider>
              </MpasiProvider>
            </ImmunizationProvider>
          </MilestonesProvider>
        </ChildProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
