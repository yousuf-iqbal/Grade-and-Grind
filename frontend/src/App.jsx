// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';

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
          <button
            onClick={() => {
              import('firebase/auth').then(({ getAuth, signOut }) => {
                signOut(getAuth());
                localStorage.removeItem('gg_user');
                window.location.href = '/auth';
              });
            }}
            style={{
              padding: '0.6rem 1.5rem', background: '#f59e0b',
              border: 'none', borderRadius: '8px',
              color: '#000', fontWeight: 700, cursor: 'pointer',
            }}>
            Logout
          </button>
        </>
      )}
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/auth" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth"      element={<AuthPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/auth" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
