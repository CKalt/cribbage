'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Leaderboard - shows game stats for all users
 * Accessible to any logged-in user
 */
export default function Leaderboard({ isOpen, onClose }) {
  const [stats, setStats] = useState([]);
  const [expertStats, setExpertStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('normal');

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        setExpertStats(data.expertStats || []);
      } else {
        setError(data.error || 'Failed to load leaderboard');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateShort = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getWinRate = (wins, losses) => {
    const total = wins + losses;
    if (total === 0) return '-';
    return Math.round((wins / total) * 100) + '%';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-4 max-w-lg w-full mx-4 shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-white">Leaderboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mb-3 border-b border-gray-600">
          <button
            onClick={() => setActiveTab('normal')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'normal'
                ? 'text-green-400 border-green-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => setActiveTab('expert')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'expert'
                ? 'text-orange-400 border-orange-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            Expert
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : (() => {
            const activeStats = activeTab === 'expert' ? expertStats : stats;
            if (activeStats.length === 0) {
              return (
                <div className="text-gray-400 text-center py-8">
                  {activeTab === 'expert' ? 'No expert games played yet.' : 'No game activity yet.'}
                </div>
              );
            }
            return (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-gray-600">
                    <th className="pb-2 w-8">#</th>
                    <th className="pb-2">Player</th>
                    <th className="pb-2 text-center">W</th>
                    <th className="pb-2 text-center">L</th>
                    <th className="pb-2 text-center">%</th>
                    <th className="pb-2 text-center">GP</th>
                    <th className="pb-2 text-right">Last</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStats.map((user, idx) => (
                    <tr key={idx} className="border-b border-gray-700">
                      <td className="py-2 text-gray-500">{idx + 1}</td>
                      <td className="py-2 text-white max-w-[150px]">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate" title={user.email}>
                            {user.email.split('@')[0]}
                          </span>
                          {user.primaryMode === activeTab && (
                            <span className={`shrink-0 text-[9px] font-bold px-1 py-0 rounded ${
                              activeTab === 'expert' ? 'bg-orange-600 text-white' : 'bg-green-700 text-white'
                            }`} title="This is their primary mode">
                              MAIN
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-center text-green-400">{user.wins}</td>
                      <td className="py-2 text-center text-red-400">{user.losses}</td>
                      <td className="py-2 text-center text-blue-400">
                        {getWinRate(user.wins, user.losses)}
                      </td>
                      <td className="py-2 text-center text-gray-400">
                        {user.gamesPlayed || 0}
                      </td>
                      <td className="py-2 text-right text-gray-400 text-xs">
                        {formatDateShort(user.lastPlayed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <Button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
