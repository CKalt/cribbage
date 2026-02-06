'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * My Games - Unified view of all games (computer + friends)
 * The Computer is always at the top, then friend games, then invite section
 */
export default function GameLobby({
  isOpen,
  onClose,
  onStartGame,
  userEmail,
  savedGameExists,
  onResumeComputerGame,
  onNewComputerGame,
}) {
  const [games, setGames] = useState([]);
  const [invitations, setInvitations] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFindPlayers, setShowFindPlayers] = useState(false);
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchAll();
    }
  }, [isOpen]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gamesRes, invitesRes] = await Promise.all([
        fetch('/api/multiplayer/games'),
        fetch('/api/multiplayer/invitations'),
      ]);
      const gamesData = await gamesRes.json();
      const invitesData = await invitesRes.json();

      if (gamesData.success) setGames(gamesData.games);
      if (invitesData.success) setInvitations({ received: invitesData.received, sent: invitesData.sent });
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    setSearchLoading(true);
    try {
      const url = searchTerm
        ? `/api/multiplayer/players?search=${encodeURIComponent(searchTerm)}`
        : '/api/multiplayer/players';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) setPlayers(data.players);
    } catch (err) {
      // ignore
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInvite = async (playerEmail) => {
    setInviteLoading(playerEmail);
    setActionMessage(null);
    try {
      const response = await fetch('/api/multiplayer/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: playerEmail })
      });
      const data = await response.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: `Invitation sent to ${playerEmail}` });
        setShowFindPlayers(false);
        fetchAll();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to send invitation' });
    } finally {
      setInviteLoading(null);
    }
  };

  const handleAcceptInvite = async (inviteId) => {
    setInviteLoading(inviteId);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/multiplayer/invitations/${inviteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      });
      const data = await response.json();
      if (data.success && data.gameId) {
        onStartGame(data.gameId);
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to accept invitation' });
    } finally {
      setInviteLoading(null);
    }
  };

  const handleDeclineInvite = async (inviteId) => {
    setInviteLoading(inviteId);
    try {
      await fetch(`/api/multiplayer/invitations/${inviteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline' })
      });
      fetchAll();
    } catch (err) {
      // ignore
    } finally {
      setInviteLoading(null);
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    setInviteLoading(inviteId);
    try {
      await fetch(`/api/multiplayer/invitations/${inviteId}`, { method: 'DELETE' });
      setActionMessage({ type: 'success', text: 'Invitation deleted' });
      fetchAll();
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to delete invitation' });
    } finally {
      setInviteLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-4 max-w-lg w-full mx-4 shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">My Games</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className={`mb-3 p-2 rounded text-sm ${
            actionMessage.type === 'success' ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'
          }`}>
            {actionMessage.text}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : (
            <>
              {/* The Computer - always first */}
              <div className={`p-3 rounded border ${
                savedGameExists ? 'bg-blue-900/30 border-blue-600' : 'border-gray-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      AI
                    </div>
                    <div>
                      <div className="text-white font-medium">The Computer</div>
                      <div className="text-gray-400 text-xs">
                        {savedGameExists ? 'Game in progress' : 'Always ready to play'}
                      </div>
                    </div>
                  </div>
                  <div>
                    {savedGameExists ? (
                      <Button
                        onClick={() => { onClose(); onResumeComputerGame(); }}
                        className="bg-blue-600 hover:bg-blue-700 text-sm"
                      >
                        Resume
                      </Button>
                    ) : (
                      <Button
                        onClick={() => { onClose(); onNewComputerGame(); }}
                        className="bg-blue-600 hover:bg-blue-700 text-sm"
                      >
                        New Game
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active multiplayer games */}
              {games.map((game) => (
                <div
                  key={game.id}
                  className={`p-3 rounded border ${
                    game.isMyTurn
                      ? 'bg-green-900/30 border-green-600'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                        {(game.opponent?.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{game.opponent?.username || 'Waiting...'}</div>
                        <div className="text-gray-400 text-xs">
                          Score: {game.myScore} - {game.opponentScore}
                        </div>
                      </div>
                    </div>
                    <div>
                      {game.isMyTurn ? (
                        <Button
                          onClick={() => onStartGame(game.id)}
                          className="bg-green-600 hover:bg-green-700 text-sm"
                        >
                          Your Turn
                        </Button>
                      ) : (
                        <Button
                          onClick={() => onStartGame(game.id)}
                          className="bg-gray-600 hover:bg-gray-700 text-sm"
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Received invitations */}
              {invitations.received.map((invite) => (
                <div
                  key={invite.id}
                  className="p-3 rounded border border-yellow-600 bg-yellow-900/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center text-white text-xs font-bold">
                        {invite.from[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{invite.from.split('@')[0]}</div>
                        <div className="text-yellow-400 text-xs">Wants to play!</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAcceptInvite(invite.id)}
                        disabled={inviteLoading === invite.id}
                        className="bg-green-600 hover:bg-green-700 text-sm px-3 py-1"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleDeclineInvite(invite.id)}
                        disabled={inviteLoading === invite.id}
                        className="bg-gray-600 hover:bg-gray-700 text-sm px-3 py-1"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Sent invitations (pending) */}
              {invitations.sent.map((invite) => (
                <div
                  key={invite.id}
                  className="p-3 rounded border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">
                        {invite.to[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{invite.to.split('@')[0]}</div>
                        <div className="text-gray-400 text-xs">Invitation pending...</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDeleteInvite(invite.id)}
                      disabled={inviteLoading === invite.id}
                      className="bg-red-600 hover:bg-red-700 text-sm px-3 py-1"
                    >
                      {inviteLoading === invite.id ? '...' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              ))}

              {/* No friend games message */}
              {games.length === 0 && invitations.received.length === 0 && invitations.sent.length === 0 && (
                <div className="text-gray-500 text-center text-sm py-2">
                  No friend games yet
                </div>
              )}
            </>
          )}
        </div>

        {/* Find Players section */}
        {showFindPlayers && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <form onSubmit={(e) => { e.preventDefault(); fetchPlayers(); }} className="mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by email..."
                  className="flex-1 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                  autoFocus
                />
                <Button type="submit" disabled={searchLoading} className="bg-blue-600 hover:bg-blue-700 text-sm">
                  {searchLoading ? '...' : 'Search'}
                </Button>
              </div>
            </form>
            {players.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 rounded bg-gray-750">
                    <div className="text-white text-sm">{player.email}</div>
                    <Button
                      onClick={() => handleInvite(player.email)}
                      disabled={inviteLoading === player.email}
                      className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                    >
                      {inviteLoading === player.email ? '...' : 'Invite'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-700 flex gap-2">
          <Button
            onClick={() => { setShowFindPlayers(!showFindPlayers); if (!showFindPlayers) fetchPlayers(); }}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {showFindPlayers ? 'Hide' : 'Invite Friend'}
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
