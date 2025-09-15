"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { checkProfileExists } from "../lib/userService";

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  profileCompleted: false,
  loading: true,
  justSignedUp: false,
  login: async (_email, _password) => {},
  signup: async (_email, _password) => {},
  loginWithGoogle: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
  setJustSignedUp: (_value) => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [justSignedUp, setJustSignedUp] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Ensure we block UI redirects while we verify profile state
      setLoading(true);
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        setUser(userData);

        // Check if profile is completed
        const profileExists = await checkProfileExists(user.uid);
        setProfileCompleted(profileExists);
      } else {
        setUser(null);
        setProfileCompleted(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const profileExists = await checkProfileExists(user.uid);
      setProfileCompleted(profileExists);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      profileCompleted,
      justSignedUp,
      loading,
      login: async (email, password) => {
        try {
          const result = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
          return result.user;
        } catch (error) {
          console.error("Login error:", error);
          throw error;
        }
      },
      signup: async (email, password) => {
        try {
          const result = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          setJustSignedUp(true);
          return result.user;
        } catch (error) {
          console.error("Signup error:", error);
          throw error;
        }
      },
      loginWithGoogle: async () => {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          // Check if this is a new user (just created)
          const isNewUser = result._tokenResponse?.isNewUser;
          if (isNewUser) {
            setJustSignedUp(true);
          }
          return result.user;
        } catch (error) {
          console.error("Google login error:", error);
          throw error;
        }
      },
      logout: async () => {
        try {
          await signOut(auth);
          setUser(null);
          setProfileCompleted(false);
          setJustSignedUp(false);
        } catch (error) {
          console.error("Logout error:", error);
          throw error;
        }
      },
      refreshProfile,
      setJustSignedUp,
    }),
    [user, loading, profileCompleted, justSignedUp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
