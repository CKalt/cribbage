'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { userPool } from '@/lib/cognito';
import { useAuth } from '@/contexts/AuthContext';
import { setCookie } from 'nookies';
import PasswordInput from '@/components/PasswordInput';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { setUser, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  if (user) return null;

  const login = async (event) => {
    event.preventDefault();
    setError(null);

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        localStorage.setItem('isLoggedIn', 'true');

        setCookie(null, 'token', result.getIdToken().getJwtToken(), {
          maxAge: 30 * 24 * 60 * 60,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        });

        cognitoUser.getUserAttributes((err, attributes) => {
          if (!err && attributes) {
            const userAttributes = {};
            attributes.forEach((attr) => {
              userAttributes[attr.Name] = attr.Value;
            });
            cognitoUser.attributes = userAttributes;
          }
          setUser(cognitoUser);
          router.push('/');
        });
      },
      onFailure: (err) => {
        console.error('Login failed:', err);
        setError(err.message || JSON.stringify(err));
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-900">
      <div className="w-96 p-10 bg-green-800 rounded-lg shadow-xl border border-green-700">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Login</h1>
        <form onSubmit={login} className="flex flex-col">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mb-3 p-3 border border-green-600 rounded-lg text-base text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <PasswordInput
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="mt-5 p-3 bg-green-600 text-white rounded-lg text-base font-semibold hover:bg-green-500 cursor-pointer transition-colors">
            Log in
          </button>
          <Link href="/signup" className="text-green-300 text-sm text-center mt-4 hover:text-green-200 hover:underline">
            Create an account
          </Link>
          <Link href="/forgot-password" className="text-green-300 text-sm text-center mt-2 hover:text-green-200 hover:underline">
            Forgot password
          </Link>
        </form>
        {error && <p className="text-red-400 mt-4 text-sm bg-red-900/30 p-2 rounded">{error}</p>}
      </div>
      <div className="text-green-400 text-sm mt-5">
        Cribbage Game <span className="text-green-600">v0.1.0-b31</span>
      </div>
    </div>
  );
}
