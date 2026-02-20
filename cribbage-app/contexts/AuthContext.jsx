'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { userPool } from '@/lib/cognito';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.getSession((err, session) => {
        if (settled) return;
        if (err || !session || !session.isValid()) {
          setUser(null);
          settled = true;
          setLoading(false);
          return;
        }

        currentUser.getUserAttributes((attrErr, attributes) => {
          if (settled) return;
          if (!attrErr && attributes) {
            const userAttributes = {};
            attributes.forEach((attr) => {
              userAttributes[attr.Name] = attr.Value;
            });
            currentUser.attributes = userAttributes;
          }
          setUser(currentUser);
          settled = true;
          setLoading(false);
        });
      });
    } else {
      settled = true;
      setLoading(false);
    }

    // Safety timeout — if Cognito calls hang, sign out cleanly after 6 seconds
    const timeout = setTimeout(() => {
      if (!settled) {
        console.warn('Auth context timed out — signing out cleanly');
        settled = true;
        // Sign out from Cognito and clear cookie to prevent redirect loops
        if (currentUser) {
          try { currentUser.signOut(); } catch (e) { /* ignore */ }
        }
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('isLoggedIn');
        setUser(null);
        setLoading(false);
      }
    }, 6000);
    return () => clearTimeout(timeout);
  }, []);

  const signOut = () => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
    setUser(null);

    if (typeof window !== 'undefined') {
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      localStorage.removeItem('isLoggedIn');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
