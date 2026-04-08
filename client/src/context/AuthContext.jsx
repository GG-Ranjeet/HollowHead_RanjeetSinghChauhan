import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../config/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const syncWithBackend = async (firebaseUser, role = 'attendee', name = null) => {
    try {
      const token = await firebaseUser.getIdToken();

      window.FIREBASE_TOKEN = token;
      if (import.meta.env.IS_DEV) {
        console.log('%c🔑 YOUR POSTMAN FIREBASE TOKEN 🔑', 'background: #222; color: #bada55; font-size: 16px;');
        console.log(token);
        console.log('%c-----------------------------------', 'background: #222; color: #bada55;');
      }

      // Hit our backend express server
      const bodyPayload = { role };
      if (name) bodyPayload.name = name;

      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json();
      if (response.ok) {
        setDbUser(data.user);
      } else {
        console.error("Failed to sync user context with backend", data.error);
        throw new Error("Backend sync failed");
      }
    } catch (error) {
      console.error("Network error syncing user:", error);
      throw error;
    }
  };

  const loginWithGoogle = async (role = 'attendee') => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncWithBackend(result.user, role);
      closeAuthModal();
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Backend automatically checks existing user in sync
      await syncWithBackend(result.user);
      closeAuthModal();
      return result.user;
    } catch (error) {
      console.error("Error logging in with email:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email, password, name, role = 'attendee') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await syncWithBackend(result.user, role, name);
      closeAuthModal();
      return result.user;
    } catch (error) {
      console.error("Error signing up with email:", error);
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
      if (user && !dbUser) { 
        // fallback sync if page refreshed
        try {
            await syncWithBackend(user);
        } catch(e) {
            console.error("Initial load sync failed", e)
        }
      } else if (!user) {
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
    loginWithEmail,
    signupWithEmail,
    logout,
    loading,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
