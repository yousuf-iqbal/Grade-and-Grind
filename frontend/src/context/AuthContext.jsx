// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          const token = await firebaseUser.getIdToken();

          // try login first
          const res = await API.post('/auth/login', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });

          setUser(res.data.user);

        } catch (err) {

          // user not in DB yet — this happens with Google sign in
          // backend returns 404 with needsRegistration: true
          if (err.response?.status === 404) {
            try {
              const token = await firebaseUser.getIdToken();

              // register route uses multer so must send as FormData
              const formData = new FormData();
              formData.append('fullName', firebaseUser.displayName || 'User');
              formData.append('email',    firebaseUser.email);
              formData.append('role',     'student'); // default role for google users

              await API.post('/auth/register', formData, {
                headers: {
                  Authorization:  `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data',
                },
              });

              // after registering, call login to get full user profile
              const loginRes = await API.post('/auth/login', {}, {
                headers: { Authorization: `Bearer ${token}` }
              });

              setUser(loginRes.data.user);

            } catch {
              setUser(null);
            }

          } else {
            setUser(null);
          }
        }

      } else {
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