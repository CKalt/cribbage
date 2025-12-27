'use client';

import CribbageGame from '@/components/CribbageGame';
import withAuth from '@/components/withAuth';
import { useAuth } from '@/contexts/AuthContext';

function Home() {
  const { signOut } = useAuth();

  return (
    <CribbageGame onLogout={signOut} />
  );
}

export default withAuth(Home);
