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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-96 p-10 bg-white rounded shadow-md">
        <h1 className="text-xl text-center mb-5 text-gray-800">Forgot Password</h1>
        {!codeSent ? (
          <form onSubmit={forgotPassword} className="flex flex-col">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mb-2 p-2.5 border border-gray-300 rounded text-base text-gray-800"
            />
            <button type="submit" className="mt-2 p-2.5 bg-blue-500 text-white rounded text-base hover:bg-blue-600 cursor-pointer">
              Send Code
            </button>
            <Link href="/login" className="text-blue-500 text-sm text-center mt-4 hover:underline">
              Back to Login
            </Link>
          </form>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              A verification code has been sent to your email. Please check your inbox and spam folder.
            </p>
            <Link href={`/reset-password?email=${encodeURIComponent(email)}`}>
              <button className="w-full p-2.5 bg-blue-500 text-white rounded text-base hover:bg-blue-600 cursor-pointer">
                Enter Code
              </button>
            </Link>
            <button onClick={resendCode} className="w-full mt-2 text-blue-500 text-sm hover:underline cursor-pointer">
              Resend Code
            </button>
            {codeResent && <p className="text-green-500 mt-2 text-sm">Code has been resent successfully!</p>}
          </div>
        )}
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>
      <div className="text-gray-400 text-sm mt-5">
        Cribbage Game
      </div>
    </div>
  );
}
