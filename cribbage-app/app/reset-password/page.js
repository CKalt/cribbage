'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConfirmForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient, clientId } from '@/lib/cognito';
import PasswordInput from '@/components/PasswordInput';

function ResetPasswordForm() {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const resetPassword = async (event) => {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      });
      await cognitoClient.send(command);
      console.log('Password reset successful');
      router.push('/login');
    } catch (err) {
      console.error('Reset password failed:', err);
      setError(err.message || JSON.stringify(err));
    }
  };

  const inputClassName = "mb-3 p-3 border border-green-600 rounded-lg text-base text-gray-800 bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-900">
      <div className="w-96 p-10 bg-green-800 rounded-lg shadow-xl border border-green-700">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">Reset Password</h1>
        <form onSubmit={resetPassword} className="flex flex-col">
          <input
            type="text"
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className={inputClassName}
          />
          <PasswordInput
            value={newPassword}
            placeholder="New Password"
            onChange={(e) => setNewPassword(e.target.value)}
            className="p-3 border border-green-600 rounded-lg text-base text-gray-800 bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="mt-3">
            <PasswordInput
              value={confirmPassword}
              placeholder="Confirm Password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="p-3 border border-green-600 rounded-lg text-base text-gray-800 bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button type="submit" className="mt-5 p-3 bg-green-600 text-white rounded-lg text-base font-semibold hover:bg-green-500 cursor-pointer transition-colors">
            Reset Password
          </button>
        </form>
        {error && <p className="text-red-400 mt-4 text-sm bg-red-900/30 p-2 rounded">{error}</p>}
      </div>
      <div className="text-green-400 text-sm mt-5">
        Cribbage Game
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-green-900 text-white">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
