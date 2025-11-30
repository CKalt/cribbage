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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-96 p-10 bg-white rounded shadow-md">
        <h1 className="text-xl text-center mb-5 text-gray-800">Login</h1>
        <form onSubmit={login} className="flex flex-col">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mb-2 p-2.5 border border-gray-300 rounded text-base text-gray-800"
          />
          <PasswordInput
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="mt-4 p-2.5 bg-blue-500 text-white rounded text-base hover:bg-blue-600 cursor-pointer">
            Log in
          </button>
          <Link href="/signup" className="text-blue-500 text-sm text-center mt-4 hover:underline">
            Create an account
          </Link>
          <Link href="/forgot-password" className="text-blue-500 text-sm text-center mt-2 hover:underline">
            Forgot password
          </Link>
        </form>
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>
      <div className="text-gray-400 text-sm mt-5">
        Cribbage Game
      </div>
    </div>
  );
}
