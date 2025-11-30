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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="w-96 p-10 bg-white rounded shadow-md">
        <h1 className="text-xl text-center mb-5 text-gray-800">Reset Password</h1>
        <form onSubmit={resetPassword} className="flex flex-col">
          <input
            type="text"
            placeholder="Verification Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="mb-2 p-2.5 border border-gray-300 rounded text-base text-gray-800"
          />
          <PasswordInput
            value={newPassword}
            placeholder="New Password"
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div className="mt-2">
            <PasswordInput
              value={confirmPassword}
              placeholder="Confirm Password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="mt-4 p-2.5 bg-blue-500 text-white rounded text-base hover:bg-blue-600 cursor-pointer">
            Reset Password
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </div>
      <div className="text-gray-400 text-sm mt-5">
        Cribbage Game
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
