'use client';

import { useEffect, useState } from 'react';

export default function GlobalError({ error, reset }) {
  const [errorInfo, setErrorInfo] = useState(null);

  useEffect(() => {
    const info = {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Error',
      stack: error?.stack?.split('\n').slice(0, 5).join('\n') || '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      isGlobal: true,
    };
    setErrorInfo(info);

    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    }).catch(() => {});
  }, [error]);

  const handleGoToLogin = () => {
    try {
      localStorage.removeItem('isLoggedIn');
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
              This usually happens after an update. Please log in again.
            </p>
            <button
              onClick={handleGoToLogin}
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
              Go to Login
            </button>
            {errorInfo && (
              <div style={{
                marginTop: '1rem',
                textAlign: 'left',
                backgroundColor: 'rgba(0,0,0,0.4)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                color: '#9ca3af',
                overflow: 'auto',
                maxHeight: '10rem',
              }}>
                <div><strong>Error:</strong> {errorInfo.name}: {errorInfo.message}</div>
                {errorInfo.stack && <pre style={{ whiteSpace: 'pre-wrap', marginTop: '0.25rem' }}>{errorInfo.stack}</pre>}
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
