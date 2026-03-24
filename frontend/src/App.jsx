// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import ClientDashboard from './pages/ClientDashboard';

// ─── PROTECTED ROUTE ─────────────────────────────────────────────────────────
// redirects to /auth if not logged in
// redirects to /dashboard which then routes by role

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/auth" replace />;
}

// ─── DASHBOARD ROUTER ─────────────────────────────────────────────────────────
// renders the correct dashboard based on user role

function DashboardRouter() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;

  if (user.role === 'student') return <StudentDashboard />;
  if (user.role === 'client')  return <ClientDashboard />;

  // admin — placeholder for now
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🛡️</div>
        <h2 style={{ color: '#f59e0b' }}>Admin Panel</h2>
        <p style={{ color: '#666' }}>Coming soon.</p>
      </div>
    </div>
  );
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid #222', borderTop: '3px solid #f59e0b',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth"      element={<AuthPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardRouter /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
