'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // On any client error after a deploy, redirect straight to login
    // This clears stale cached JS and auth state
    const reloadKey = 'chunk-error-reload';
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();

    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem(reloadKey, now.toString());
      window.location.href = '/login?_cb=' + Date.now();
      return;
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-900 text-white p-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-green-300">
          This usually happens after an update. Please log in again.
        </p>
        <button
          onClick={() => window.location.href = '/login?_cb=' + Date.now()}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
