'use client';

import CribbageGame from '@/components/CribbageGame';
import withAuth from '@/components/withAuth';
import { useAuth } from '@/contexts/AuthContext';

function Home() {
  const { signOut, user } = useAuth();

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={signOut}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm shadow-lg"
        >
          Logout ({user?.attributes?.email || 'User'})
        </button>
      </div>
      <CribbageGame />
    </div>
  );
}

export default withAuth(Home);
