// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentPublicProfilePage from './pages/StudentPublicProfilePage';

// placeholder dashboard — replace with real dashboard later
function Dashboard() {
  const { user } = useAuth();
  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '1rem', fontFamily: 'system-ui',
    }}>
      <div style={{ fontSize: '2rem' }}>🎓</div>
      <h1 style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 800 }}>Grade & Grind</h1>
      {user && (
        <>
          <p>Welcome, <strong>{user.fullName}</strong>!</p>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Role: <span style={{ color: '#f59e0b' }}>{user.role}</span>
          </p>
          {user.role === 'student' && (
            <a href="/profile/edit"
              style={{
                padding: '0.5rem 1.25rem', background: '#f59e0b',
                borderRadius: '8px', color: '#000', fontWeight: 700,
                textDecoration: 'none', fontSize: '0.9rem',
              }}>
              My Profile
            </a>
          )}
          <button
            onClick={() => {
              import('firebase/auth').then(({ getAuth, signOut }) => {
                signOut(getAuth());
                localStorage.removeItem('gg_user');
                window.location.href = '/auth';
              });
            }}
            style={{
              padding: '0.6rem 1.5rem', background: 'transparent',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#aaa', fontWeight: 700, cursor: 'pointer',
            }}>
            Logout
          </button>
        </>
      )}
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          {/* student edits their own profile */}
          <Route path="/profile/edit" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentProfilePage />
            </ProtectedRoute>
          } />

          {/* public profile view — any logged in user */}
          <Route path="/profile/:userID" element={
            <ProtectedRoute>
              <StudentPublicProfilePage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}