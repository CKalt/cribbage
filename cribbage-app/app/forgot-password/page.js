'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient, clientId } from '@/lib/cognito';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [codeResent, setCodeResent] = useState(false);
  const [error, setError] = useState(null);

  const forgotPassword = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const command = new ForgotPasswordCommand({
        ClientId: clientId,
        Username: email,
      });
      await cognitoClient.send(command);
      setCodeSent(true);
    } catch (err) {
      console.error('Forgot password failed:', err);
      setError(err.message || JSON.stringify(err));
    }
  };

  const resendCode = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const command = new ForgotPasswordCommand({
        ClientId: clientId,
        Username: email,
      });
      await cognitoClient.send(command);
      setCodeResent(true);
      setTimeout(() => setCodeResent(false), 3000);
    } catch (err) {
      console.error('Resend code failed:', err);
      setError(err.message || JSON.stringify(err));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-900">
      <div className="w-96 p-10 bg-green-800 rounded-lg shadow-xl border border-green-700">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Forgot Password</h1>
        {!codeSent ? (
          <form onSubmit={forgotPassword} className="flex flex-col">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mb-3 p-3 border border-green-600 rounded-lg text-base text-gray-800 bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button type="submit" className="mt-2 p-3 bg-green-600 text-white rounded-lg text-base font-semibold hover:bg-green-500 cursor-pointer transition-colors">
              Send Code
            </button>
            <Link href="/login" className="text-green-300 text-sm text-center mt-4 hover:text-green-200 hover:underline">
              Back to Login
            </Link>
          </form>
        ) : (
          <div>
            <p className="text-green-200 mb-4">
              A verification code has been sent to your email. Please check your inbox and spam folder.
            </p>
            <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
              <button className="w-full p-3 bg-green-600 text-white rounded-lg text-base font-semibold hover:bg-green-500 cursor-pointer transition-colors">
                Enter Code
              </button>
            </Link>
            <button onClick={resendCode} className="w-full mt-2 text-green-300 text-sm hover:text-green-200 hover:underline cursor-pointer">
              Resend Code
            </button>
            {codeResent && <p className="text-green-400 mt-2 text-sm">Code has been resent successfully!</p>}
          </div>
        )}
        {error && <p className="text-red-400 mt-4 text-sm bg-red-900/30 p-2 rounded">{error}</p>}
      </div>
      <div className="text-green-400 text-sm mt-5">
        Cribbage Game
      </div>
    </div>
  );
}
