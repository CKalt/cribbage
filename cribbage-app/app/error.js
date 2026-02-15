'use client';

import { useEffect, useState } from 'react';

export default function Error({ error, reset }) {
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    // Capture error details for display and logging
    const info = {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      stack: error?.stack?.split('\n').slice(0, 5).join('\n') || '',
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
    setErrorInfo(info);

    // Log to server so we can diagnose
    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    }).catch(() => {}); // fire and forget
  }, [error]);

  const handleGoToLogin = () => {
    // Clear all auth state so login page doesn't auto-redirect back here
    try {
      localStorage.removeItem('isLoggedIn');
      // Clear Cognito tokens from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('CognitoIdentityServiceProvider')) {
          localStorage.removeItem(key);
        }
      });
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = '/login?_cb=' + Date.now();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-900 text-white p-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-green-300">
          This usually happens after an update. Please log in again.
        </p>
        <button
          onClick={handleGoToLogin}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
        >
          Go to Login
        </button>
        {errorInfo && (
          <div className="mt-4 text-left bg-black/40 p-3 rounded text-xs text-gray-400 overflow-auto max-h-40">
            <div><strong>Error:</strong> {errorInfo.name}: {errorInfo.message}</div>
            {errorInfo.stack && <pre className="mt-1 whitespace-pre-wrap">{errorInfo.stack}</pre>}
          </div>
        )}
      </div>
    </div>
  );
}
