'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import VersionNotification from '@/components/VersionNotification';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <VersionNotification />
      {children}
    </AuthProvider>
  );
}
