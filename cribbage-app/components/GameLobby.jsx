'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Game Lobby - Find players, send invitations, view active games
 */
export default function GameLobby({ isOpen, onClose, onStartGame, userEmail }) {
  const [activeTab, setActiveTab] = useState('players');
  const [players, setPlayers] = useState([]);
  const [invitations, setInvitations] = useState({ received: [], sent: [] });
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteLoading, setInviteLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'players') {
        fetchPlayers();
      } else if (activeTab === 'invitations') {
        fetchInvitations();
      } else if (activeTab === 'games') {
        fetchGames();
      }
    }
  }, [isOpen, activeTab]);

  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = searchTerm
        ? `/api/multiplayer/players?search=${encodeURIComponent(searchTerm)}`
        : '/api/multiplayer/players';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setPlayers(data.players);
      } else {
        setError(data.error || 'Failed to load players');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/multiplayer/invitations');
      const data = await response.json();
      if (data.success) {
        setInvitations({ received: data.received, sent: data.sent });
      } else {
        setError(data.error || 'Failed to load invitations');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/multiplayer/games');
      const data = await response.json();
      if (data.success) {
        setGames(data.games);
      } else {
        setError(data.error || 'Failed to load games');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPlayers();
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
        fetchPlayers(); // Refresh to update hasActiveGame status
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to send invitation' });
    } finally {
      setInviteLoading(null);
    }
  };

  const handleInviteAction = async (inviteId, action) => {
    setInviteLoading(inviteId);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/multiplayer/invitations/${inviteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await response.json();
      if (data.success) {
        if (action === 'accept' && data.gameId) {
          setActionMessage({ type: 'success', text: 'Game started!' });
          // Give user a moment to see the message, then start game
          setTimeout(() => {
            onStartGame(data.gameId);
          }, 1000);
        } else {
          setActionMessage({ type: 'success', text: `Invitation ${action}ed` });
          fetchInvitations();
        }
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: `Failed to ${action} invitation` });
    } finally {
      setInviteLoading(null);
    }
  };

  const handleJoinGame = (gameId) => {
    onStartGame(gameId);
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-4 max-w-lg w-full mx-4 shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-white">Play vs Friend</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('players')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'players'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Find Players
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-3 py-1 text-sm rounded relative ${
              activeTab === 'invitations'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Invitations
            {invitations.received.length > 0 && activeTab !== 'invitations' && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {invitations.received.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'games'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            My Games
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
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : activeTab === 'players' ? (
            /* Players Tab */
            <div>
              <form onSubmit={handleSearch} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by email or username..."
                    className="flex-1 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                  />
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Search
                  </Button>
                </div>
              </form>

              {players.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  {searchTerm ? 'No players found' : 'No other players yet'}
                </div>
              ) : (
                <div className="space-y-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-gray-750 rounded border border-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${player.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <div>
                          <div className="text-white font-medium">{player.username}</div>
                          <div className="text-gray-400 text-xs">{player.email}</div>
                        </div>
                      </div>
                      <div>
                        {player.hasActiveGame ? (
                          <span className="text-gray-500 text-sm">Playing</span>
                        ) : (
                          <Button
                            onClick={() => handleInvite(player.email)}
                            disabled={inviteLoading === player.email}
                            className="bg-green-600 hover:bg-green-700 text-sm px-3 py-1"
                          >
                            {inviteLoading === player.email ? '...' : 'Invite'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'invitations' ? (
            /* Invitations Tab */
            <div className="space-y-4">
              {/* Received */}
              <div>
                <h3 className="text-gray-400 text-sm font-medium mb-2">Received</h3>
                {invitations.received.length === 0 ? (
                  <div className="text-gray-500 text-sm py-2">No pending invitations</div>
                ) : (
                  <div className="space-y-2">
                    {invitations.received.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3 bg-gray-750 rounded border border-green-700"
                      >
                        <div>
                          <div className="text-white">From: {invite.from}</div>
                          <div className="text-gray-400 text-xs">{formatTimeAgo(invite.createdAt)}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleInviteAction(invite.id, 'accept')}
                            disabled={inviteLoading === invite.id}
                            className="bg-green-600 hover:bg-green-700 text-sm px-3 py-1"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleInviteAction(invite.id, 'decline')}
                            disabled={inviteLoading === invite.id}
                            className="bg-gray-600 hover:bg-gray-700 text-sm px-3 py-1"
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent */}
              <div>
                <h3 className="text-gray-400 text-sm font-medium mb-2">Sent</h3>
                {invitations.sent.length === 0 ? (
                  <div className="text-gray-500 text-sm py-2">No sent invitations</div>
                ) : (
                  <div className="space-y-2">
                    {invitations.sent.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3 bg-gray-750 rounded border border-gray-700"
                      >
                        <div>
                          <div className="text-white">To: {invite.to}</div>
                          <div className="text-gray-400 text-xs">{formatTimeAgo(invite.createdAt)}</div>
                        </div>
                        <span className="text-yellow-500 text-sm">Pending</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Games Tab */
            <div>
              {games.length === 0 ? (
                <div className="text-gray-400 text-center py-8">No active games</div>
              ) : (
                <div className="space-y-2">
                  {games.map((game) => (
                    <div
                      key={game.id}
                      className={`p-3 rounded border ${
                        game.isMyTurn
                          ? 'bg-green-900/30 border-green-600'
                          : 'bg-gray-750 border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">
                            vs {game.opponent?.username || 'Waiting...'}
                          </div>
                          <div className="text-gray-400 text-sm">
                            Score: {game.myScore} - {game.opponentScore}
                          </div>
                          {game.lastMove?.description && (
                            <div className="text-gray-500 text-xs mt-1">
                              Last: {game.lastMove.description}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {game.isMyTurn ? (
                            <Button
                              onClick={() => handleJoinGame(game.id)}
                              className="bg-green-600 hover:bg-green-700 text-sm"
                            >
                              Your Turn
                            </Button>
                          ) : (
                            <div>
                              <div className="text-yellow-500 text-sm">Waiting</div>
                              <Button
                                onClick={() => handleJoinGame(game.id)}
                                className="bg-gray-600 hover:bg-gray-700 text-sm mt-1"
                              >
                                View
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
