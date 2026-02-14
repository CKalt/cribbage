'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Auto-reload on chunk/module load errors from stale deploys
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('client-side exception');

    if (isChunkError) {
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
    <html lang="en">
      <body style={{ backgroundColor: '#14532d', color: 'white', margin: 0 }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#86efac', marginBottom: '1.5rem' }}>
              This usually happens after an update. Tap the button below to reload.
            </p>
            <button
              onClick={() => window.location.href = window.location.pathname + '?_cb=' + Date.now()}
              style={{
                backgroundColor: '#16a34a',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '1.125rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
