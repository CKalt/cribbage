'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseCookies, destroyCookie } from 'nookies';
import { useAuth } from '@/contexts/AuthContext';
import { userPool } from '@/lib/cognito';

export default function withAuth(WrappedComponent) {
  return function AuthComponent(props) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [isValidating, setIsValidating] = useState(true);

    useEffect(() => {
      const validateAuth = async () => {
        const { token } = parseCookies();

        if (!token) {
          router.replace('/login');
          return;
        }

        const currentUser = userPool.getCurrentUser();

        if (!currentUser) {
          destroyCookie(null, 'token', { path: '/' });
          router.replace('/login');
          return;
        }

        currentUser.getSession((err, session) => {
          if (err || !session || !session.isValid()) {
            currentUser.signOut();
            destroyCookie(null, 'token', { path: '/' });
            if (typeof window !== 'undefined') {
              localStorage.removeItem('isLoggedIn');
            }
            router.replace('/login');
            return;
          }
          setIsValidating(false);
        });
      };

      if (!loading) {
        validateAuth();
      }

      // Safety timeout — if validation hangs for 8 seconds, redirect to login
      const timeout = setTimeout(() => {
        if (isValidating) {
          console.warn('Auth validation timed out — redirecting to login');
          destroyCookie(null, 'token', { path: '/' });
          if (typeof window !== 'undefined') {
            localStorage.removeItem('isLoggedIn');
          }
          router.replace('/login');
        }
      }, 8000);
      return () => clearTimeout(timeout);
    }, [loading, router]);

    if (loading || isValidating) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-green-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-white">Validating authentication...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
