'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CognitoUser } from 'amazon-cognito-identity-js';
import { userPool } from '@/lib/cognito';

function ConfirmForm() {
  const [confirmationCode, setConfirmationCode] = useState('');
  const [error, setError] = useState(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const confirmSignUp = async (event) => {
    event.preventDefault();
    setError(null);

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(confirmationCode, true, function(err, result) {
      if (err) {
        console.error('Confirmation failed:', err);
        setError(err.message || JSON.stringify(err));
        return;
      }
      console.log(`User ${cognitoUser.getUsername()} is confirmed`);
      router.push('/login');
    });
  };

  const resendCode = async () => {
    setError(null);
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.resendConfirmationCode((err) => {
      if (err) {
        console.error('Resend failed:', err);
        setError(err.message || JSON.stringify(err));
        return;
      }
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-900">
      <div className="w-96 p-10 bg-green-800 rounded-lg shadow-xl border border-green-700">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Confirm Your Email</h1>
        <div className="bg-green-700/50 border-l-4 border-green-400 p-3 mb-5 text-sm text-green-200">
          A message containing your confirmation code was sent to the email address provided.
        </div>
        <form onSubmit={confirmSignUp} className="flex flex-col">
          <input
            type="text"
            value={confirmationCode}
            placeholder="Enter confirmation code"
            onChange={(e) => setConfirmationCode(e.target.value)}
            required
            className="mb-3 p-3 border border-green-600 rounded-lg text-base text-gray-800 bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button type="submit" className="mt-2 p-3 bg-green-600 text-white rounded-lg text-base font-semibold hover:bg-green-500 cursor-pointer transition-colors">
            Confirm Sign Up
          </button>
        </form>
        <button
          onClick={resendCode}
          className="w-full mt-3 p-3 bg-green-700 border border-green-600 text-green-200 rounded-lg text-sm hover:bg-green-600 cursor-pointer transition-colors"
        >
          Resend Code
        </button>
        {resendSuccess && <p className="text-green-400 mt-2 text-sm">Another code has been sent to your email.</p>}
        {error && <p className="text-red-400 mt-4 text-sm bg-red-900/30 p-2 rounded">{error}</p>}
      </div>
      <div className="text-green-400 text-sm mt-5">
        Cribbage Game
      </div>
    </div>
  );
}

export default function Confirm() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-green-900 text-white">Loading...</div>}>
      <ConfirmForm />
    </Suspense>
  );
}
