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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-96 p-10 bg-white rounded shadow-md">
        <h1 className="text-xl text-center mb-5 text-gray-800">Create Account</h1>
        <form onSubmit={signUp} className="flex flex-col">
          <input
            type="email"
            value={email}
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mb-2 p-2.5 border border-gray-300 rounded text-base text-gray-800"
          />
          <PasswordInput
            value={password}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordRequirements
            password={password}
            onValidationChange={(isValid) => setPasswordValid(isValid)}
          />
          <button
            type="submit"
            disabled={!passwordValid}
            className="mt-4 p-2.5 bg-blue-500 text-white rounded text-base hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
          >
            Sign Up
          </button>
          <Link href="/login" className="text-blue-500 text-sm text-center mt-4 hover:underline">
            Back to login
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
