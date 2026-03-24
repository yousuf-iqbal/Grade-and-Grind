// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // only call our backend if firebase user exists AND email is verified
      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          const res = await API.post('/auth/login');
          setUser(res.data.user);
        } catch (err) {
          // 404 means registered in firebase but not in our DB yet (edge case)
          // 403 means banned or unverified
          console.error('auth context login error:', err.response?.data?.error);
          setUser(null);
        }
      } else {
        // not logged in, or email not verified yet
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);