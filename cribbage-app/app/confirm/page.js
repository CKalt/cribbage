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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-96 p-10 bg-white rounded shadow-md">
        <h1 className="text-xl text-center mb-5 text-gray-800">Confirm Your Email</h1>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-5 text-sm text-blue-700">
          A message containing your confirmation code was sent to the email address provided.
        </div>
        <form onSubmit={confirmSignUp} className="flex flex-col">
          <input
            type="text"
            value={confirmationCode}
            placeholder="Enter confirmation code"
            onChange={(e) => setConfirmationCode(e.target.value)}
            required
            className="mb-2 p-2.5 border border-gray-300 rounded text-base text-gray-800"
          />
          <button type="submit" className="mt-2 p-2.5 bg-blue-500 text-white rounded text-base hover:bg-blue-600 cursor-pointer">
            Confirm Sign Up
          </button>
        </form>
        <button
          onClick={resendCode}
          className="w-full mt-2 p-2.5 bg-white border border-blue-500 text-blue-500 rounded text-sm hover:bg-blue-50 cursor-pointer"
        >
          Resend Code
        </button>
        {resendSuccess && <p className="text-green-500 mt-2 text-sm">Another code has been sent to your email.</p>}
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>
      <div className="text-gray-400 text-sm mt-5">
        Cribbage Game
      </div>
    </div>
  );
}

export default function Confirm() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ConfirmForm />
    </Suspense>
  );
}
