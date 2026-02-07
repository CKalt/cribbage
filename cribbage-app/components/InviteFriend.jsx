'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Invite Friend to Play - simple modal to search and invite a player
 */
export default function InviteFriend({ isOpen, onClose, onGameStarted }) {
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setMessage(null);
      fetchPlayers();
    }
  }, [isOpen]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const url = searchTerm
        ? `/api/multiplayer/players?search=${encodeURIComponent(searchTerm)}`
        : '/api/multiplayer/players';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setPlayers(data.players);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (playerEmail) => {
    setInviteLoading(playerEmail);
    setMessage(null);
    try {
      const response = await fetch('/api/multiplayer/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: playerEmail })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Invitation sent to ${playerEmail.split('@')[0]}! Waiting for them to accept...` });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send invitation' });
    } finally {
      setInviteLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-5 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Invite Friend to Play</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Search */}
        <form onSubmit={(e) => { e.preventDefault(); fetchPlayers(); }} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email..."
              className="flex-1 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none text-sm"
              autoFocus
            />
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              Search
            </Button>
          </div>
        </form>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded text-sm ${
            message.type === 'success' ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'
          }`}>
            {message.text}
          </div>
        )}

        {/* Player list */}
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {loading ? (
            <div className="text-gray-400 text-center py-4">Searching...</div>
          ) : players.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              {searchTerm ? 'No players found' : 'No other players yet'}
            </div>
          ) : (
            players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded border border-gray-700 hover:border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <div>
                    <div className="text-white font-medium">{player.username}</div>
                    <div className="text-gray-400 text-xs">{player.email}</div>
                  </div>
                </div>
                <Button
                  onClick={() => handleInvite(player.email)}
                  disabled={inviteLoading === player.email || player.hasActiveGame}
                  className={`text-sm px-4 py-1 ${
                    player.hasActiveGame
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {inviteLoading === player.email ? '...' : player.hasActiveGame ? 'In Game' : 'Invite'}
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <Button onClick={onClose} className="w-full bg-gray-600 hover:bg-gray-700">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
