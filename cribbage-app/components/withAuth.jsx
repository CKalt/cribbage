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
      if (!loading) {
        if (user) {
          // AuthContext already validated the Cognito session — trust it.
          // Re-set the cookie in case it was cleared, so future loads work too.
          const currentUser = userPool.getCurrentUser();
          if (currentUser) {
            currentUser.getSession((err, session) => {
              if (!err && session && session.isValid()) {
                const { setCookie } = require('nookies');
                setCookie(null, 'token', session.getIdToken().getJwtToken(), {
                  maxAge: 30 * 24 * 60 * 60,
                  path: '/',
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                });
              }
              setIsValidating(false);
            });
          } else {
            setIsValidating(false);
          }
        } else {
          // No valid user from AuthContext — redirect to login
          destroyCookie(null, 'token', { path: '/' });
          router.replace('/login');
        }
      }
    }, [loading, user, router]);

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
