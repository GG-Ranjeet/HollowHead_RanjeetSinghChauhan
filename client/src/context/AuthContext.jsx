import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncWithBackend = async (firebaseUser) => {
    try {
      const token = await firebaseUser.getIdToken();

      // EXPOSE TOKEN FOR POSTMAN TESTING
      window.FIREBASE_TOKEN = token;
      if (import.meta.env.IS_DEV) {
        console.log('%c🔑 YOUR POSTMAN FIREBASE TOKEN 🔑', 'background: #222; color: #bada55; font-size: 16px;');
        console.log(token);
        console.log('%c-----------------------------------', 'background: #222; color: #bada55;');
      }

      // Hit our backend express server. (Vite proxies /api to port 5000)
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: 'attendee' // Default initialization role 
        })
      });

      const data = await response.json();
      if (response.ok) {
        setDbUser(data.user);
      } else {
        console.error("Failed to sync user context with backend", data.error);
      }
    } catch (error) {
      console.error("Network error syncing user:", error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setDbUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncWithBackend(user);
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    dbUser,
    loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
