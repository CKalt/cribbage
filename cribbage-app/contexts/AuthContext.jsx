'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { userPool } from '@/lib/cognito';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.getSession((err, session) => {
        if (err || !session || !session.isValid()) {
          setUser(null);
          setLoading(false);
          return;
        }

        currentUser.getUserAttributes((attrErr, attributes) => {
          if (!attrErr && attributes) {
            const userAttributes = {};
            attributes.forEach((attr) => {
              userAttributes[attr.Name] = attr.Value;
            });
            currentUser.attributes = userAttributes;
          }
          setUser(currentUser);
          setLoading(false);
        });
      });
    } else {
      setLoading(false);
    }
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
