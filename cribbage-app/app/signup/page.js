'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { userPool } from '@/lib/cognito';
import PasswordInput from '@/components/PasswordInput';
import PasswordRequirements from '@/components/PasswordRequirements';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordValid, setPasswordValid] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const signUp = async (event) => {
    event.preventDefault();
    setError(null);

    const attributeList = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: email,
      }),
    ];

    userPool.signUp(email, password, attributeList, null, (err, result) => {
      if (err) {
        console.error('Signup failed:', err);
        setError(err.message || JSON.stringify(err));
        return;
      }
      console.log(`User ${result.user.getUsername()} is signed up`);
      router.push(`/confirm?email=${encodeURIComponent(email)}`);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-900">
      <div className="w-96 p-10 bg-green-800 rounded-lg shadow-xl border border-green-700">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Create Account</h1>
        <form onSubmit={signUp} className="flex flex-col">
          <input
            type="email"
            value={email}
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mb-3 p-3 border border-green-600 rounded-lg text-base text-gray-800 bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <PasswordInput
            value={password}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 border border-green-600 rounded-lg text-base text-gray-800 bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <PasswordRequirements
            password={password}
            onValidationChange={(isValid) => setPasswordValid(isValid)}
          />
          <button
            type="submit"
            disabled={!passwordValid}
            className="mt-5 p-3 bg-green-600 text-white rounded-lg text-base font-semibold hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Sign Up
          </button>
          <Link href="/login" className="text-green-300 text-sm text-center mt-4 hover:text-green-200 hover:underline">
            Back to login
          </Link>
        </form>
        {error && <p className="text-red-400 mt-4 text-sm bg-red-900/30 p-2 rounded">{error}</p>}
      </div>
      <div className="text-green-400 text-sm mt-5">
        Cribbage Game
      </div>
    </div>
  );
}
