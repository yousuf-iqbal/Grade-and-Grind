
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage        from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import ClientDashboard  from './pages/ClientDashboard';
import GigBoardPage     from './pages/GigBoardPage';
import PostGigPage      from './pages/PostGigPage';
import EditProfilePage  from './pages/EditProfilePage';

// ── role-aware dashboard redirect ─────────────────────────────────────────────
function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" />;
  if (user.role === 'client') return <ClientDashboard />;
  return <StudentDashboard />;
}

// ── protect any route — redirect to /auth if not logged in ────────────────────
function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user)   return <Navigate to="/auth" />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/dashboard" />;
  return children;
}

// ── redirect logged-in users away from /auth ──────────────────────────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user)    return <Navigate to="/dashboard" />;
  return children;
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>🎓</div>
        <p style={{ margin: 0, color: '#444' }}>Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* public */}
          <Route path="/auth" element={
            <PublicRoute><AuthPage /></PublicRoute>
          } />

          {/* dashboard — role-aware */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardRouter /></ProtectedRoute>
          } />

          {/* student routes */}
          <Route path="/gigs" element={
            <ProtectedRoute allowedRole="student"><GigBoardPage /></ProtectedRoute>
          } />
          <Route path="/profile/edit" element={
            <ProtectedRoute allowedRole="student"><EditProfilePage /></ProtectedRoute>
          } />

          {/* client routes */}
          <Route path="/post-gig" element={
            <ProtectedRoute allowedRole="client"><PostGigPage /></ProtectedRoute>
          } />
          <Route path="/gigs/:id/edit" element={
            <ProtectedRoute allowedRole="client"><PostGigPage /></ProtectedRoute>
          } />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
