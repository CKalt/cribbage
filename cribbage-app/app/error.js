'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Detect chunk load errors (stale JS from previous deploy)
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('client-side exception');

    if (isChunkError) {
      // Force a full page reload to get fresh JS bundles
      // Use a sessionStorage flag to prevent infinite reload loops
      const reloadKey = 'chunk-error-reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();

      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.href = window.location.pathname + '?_cb=' + Date.now();
        return;
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-900 text-white p-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-green-300">
          This usually happens after an update. Tap the button below to reload.
        </p>
        <button
          onClick={() => window.location.href = window.location.pathname + '?_cb=' + Date.now()}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
        >
          Reload App
        </button>
      </div>
    </div>
  );
}
