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
          className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg border border-green-600 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
      <CribbageGame />
    </div>
  );
}

export default withAuth(Home);
