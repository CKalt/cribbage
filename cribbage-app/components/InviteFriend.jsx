'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Invite Friend to Play - simple modal to search and invite a player
 * Loads all players once, filters client-side as you type.
 * After sending an invitation, polls to detect when the friend accepts.
 */
export default function InviteFriend({ isOpen, onClose, onGameStarted }) {
  const [allPlayers, setAllPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [waitingForAccept, setWaitingForAccept] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setMessage(null);
      setWaitingForAccept(false);
      fetchPlayers();
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen]);

  // Poll for accepted invitations when waiting
  useEffect(() => {
    if (waitingForAccept && isOpen) {
      pollRef.current = setInterval(async () => {
        try {
          const response = await fetch('/api/multiplayer/invitations');
          const data = await response.json();
          if (data.success && data.acceptedGames?.length > 0) {
            clearInterval(pollRef.current);
            pollRef.current = null;
            const game = data.acceptedGames[0];
            setMessage({ type: 'success', text: `${game.to.split('@')[0]} accepted! Starting game...` });
            setTimeout(() => {
              onGameStarted(game.gameId);
            }, 1000);
          }
        } catch (err) {
          // ignore poll errors
        }
      }, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [waitingForAccept, isOpen, onGameStarted]);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/multiplayer/players');
      const data = await response.json();
      if (data.success) {
        setAllPlayers(data.players);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Client-side filter as you type
  const filteredPlayers = useMemo(() => {
    if (!searchTerm.trim()) return allPlayers;
    const term = searchTerm.toLowerCase();
    return allPlayers.filter(
      p => p.username.toLowerCase().includes(term) || p.email.toLowerCase().includes(term)
    );
  }, [allPlayers, searchTerm]);

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
        setWaitingForAccept(true);
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

        {/* Search - live filter, no submit needed */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by name or email..."
            className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-green-500 focus:outline-none text-sm"
            autoFocus
          />
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded text-sm ${
            message.type === 'success' ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'
          }`}>
            {message.text}
          </div>
        )}

        {/* Waiting indicator */}
        {waitingForAccept && (
          <div className="mb-4 text-center text-yellow-400 text-sm animate-pulse">
            Waiting for friend to accept...
          </div>
        )}

        {/* Player list */}
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {loading ? (
            <div className="text-gray-400 text-center py-4">Loading players...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              {searchTerm ? 'No players match' : 'No other players yet'}
            </div>
          ) : (
            filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 rounded border border-gray-700 hover:border-gray-600"
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${player.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{player.username}</div>
                  <div className="text-gray-400 text-xs truncate">{player.email}</div>
                </div>
                <Button
                  onClick={() => handleInvite(player.email)}
                  disabled={inviteLoading === player.email || player.hasActiveGame}
                  className={`text-sm px-4 py-1 flex-shrink-0 ${
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
