'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Admin Panel - shows game stats and bug reports for all users
 * Only accessible to chris@chrisk.com
 */
export default function AdminPanel({ isOpen, onClose, userEmail }) {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState([]);
  const [reports, setReports] = useState([]);
  const [mpGames, setMpGames] = useState([]);
  const [mpInvites, setMpInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setActionMessage(null);
      if (activeTab === 'stats') {
        fetchStats();
      } else if (activeTab === 'reports') {
        fetchReports();
      } else if (activeTab === 'multiplayer') {
        fetchMultiplayer();
      }
    }
  }, [isOpen, activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/stats?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to load stats');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/bug-reports?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
      } else {
        setError(data.error || 'Failed to load reports');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMultiplayer = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/multiplayer');
      const data = await response.json();
      if (data.success) {
        setMpGames(data.games);
        setMpInvites(data.invitations);
      } else {
        setError(data.error || 'Failed to load multiplayer data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMpAction = async (action, id) => {
    setActionMessage(null);
    try {
      const response = await fetch('/api/admin/multiplayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id })
      });
      const data = await response.json();
      if (data.success) {
        setActionMessage({ type: 'success', text: data.message });
        fetchMultiplayer();
      } else {
        setActionMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed: ' + err.message });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatDateShort = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-4 max-w-2xl w-full mx-4 shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'stats'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Game Activity
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Bug Reports
          </button>
          <button
            onClick={() => setActiveTab('multiplayer')}
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'multiplayer'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Multiplayer
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : activeTab === 'stats' ? (
            /* Game Activity Tab */
            <div className="space-y-2">
              {stats.length === 0 ? (
                <div className="text-gray-400 text-center py-8">No game activity yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 text-left border-b border-gray-600">
                      <th className="pb-2">Email</th>
                      <th className="pb-2 text-center">W</th>
                      <th className="pb-2 text-center">L</th>
                      <th className="pb-2 text-center">F</th>
                      <th className="pb-2 text-right">Last Played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((user, idx) => (
                      <tr key={idx} className="border-b border-gray-700">
                        <td className="py-2 text-white truncate max-w-[200px]" title={user.email}>
                          {user.email}
                        </td>
                        <td className="py-2 text-center text-green-400">{user.wins}</td>
                        <td className="py-2 text-center text-red-400">{user.losses}</td>
                        <td className="py-2 text-center text-yellow-400">{user.forfeits}</td>
                        <td className="py-2 text-right text-gray-400">{formatDateShort(user.lastPlayed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : activeTab === 'reports' ? (
            /* Bug Reports Tab */
            <div className="space-y-2">
              {reports.length === 0 ? (
                <div className="text-gray-400 text-center py-8">No bug reports.</div>
              ) : (
                reports.map(report => (
                  <div
                    key={report.id}
                    className={`rounded border ${
                      report.archived
                        ? 'border-gray-700 bg-gray-800'
                        : 'border-gray-600 bg-gray-750'
                    }`}
                  >
                    {/* Report Header - Clickable */}
                    <button
                      onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                      className="w-full text-left p-3"
                    >
                      <div className="flex items-start gap-2">
                        {/* Ref Number */}
                        <span className="text-blue-400 font-bold text-sm w-8">
                          #{report.refNum}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2 flex-wrap">
                            <span className="text-yellow-300 text-xs truncate max-w-[180px]" title={report.email}>
                              {report.email}
                            </span>
                            <div className="flex gap-1 items-center">
                              <span className="text-gray-400 text-xs">
                                {formatDateShort(report.timestamp)}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                report.type === 'AUTO_STUCK_STATE'
                                  ? 'bg-yellow-900 text-yellow-300'
                                  : 'bg-blue-900 text-blue-300'
                              }`}>
                                {report.type === 'AUTO_STUCK_STATE' ? 'Stuck' : 'Manual'}
                              </span>
                              {report.archived && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
                                  Archived
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-white text-sm mt-1 truncate">
                            {report.description}
                          </p>
                          {report.replyCount > 0 && (
                            <p className="text-green-400 text-xs mt-1">
                              {report.replyCount} {report.replyCount === 1 ? 'reply' : 'replies'}
                            </p>
                          )}
                        </div>
                        <span className="text-gray-500 text-lg flex-shrink-0">
                          {expandedId === report.id ? '▼' : '▶'}
                        </span>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {expandedId === report.id && (
                      <div className="px-3 pb-3 border-t border-gray-600">
                        <div className="mt-3">
                          <div className="text-gray-400 text-xs mb-1">Full Description:</div>
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">
                            {report.fullDescription}
                          </p>
                        </div>

                        {/* Replies */}
                        {report.replies && report.replies.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="text-gray-400 text-xs">Replies:</div>
                            {report.replies.map((reply, idx) => (
                              <div key={idx} className="bg-green-900/30 border border-green-700 rounded p-2">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-green-400 text-xs font-medium">
                                    {reply.from}
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    {formatDate(reply.timestamp)}
                                  </span>
                                </div>
                                <p className="text-green-100 text-sm">
                                  {reply.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 text-gray-500 text-xs">
                          ID: {report.id}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'multiplayer' ? (
            /* Multiplayer Tab */
            <div className="space-y-4">
              {/* Action message */}
              {actionMessage && (
                <div className={`p-2 rounded text-sm ${
                  actionMessage.type === 'success' ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'
                }`}>
                  {actionMessage.text}
                </div>
              )}

              {/* Nuke All button */}
              <Button
                onClick={() => {
                  if (confirm('Delete ALL games and invitations?')) {
                    handleMpAction('nuke-all');
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-sm"
              >
                Delete All Games & Invitations
              </Button>

              {/* Games */}
              <div>
                <div className="text-gray-400 text-xs mb-2 uppercase tracking-wide">
                  Games ({mpGames.length})
                </div>
                {mpGames.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-2">No games</div>
                ) : (
                  mpGames.map((game) => (
                    <div key={game.id} className="flex items-center justify-between p-2 rounded border border-gray-700 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm truncate">
                          {game.player1.split('@')[0]} vs {game.player2.split('@')[0]}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {game.status} - {formatDateShort(game.createdAt)}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleMpAction('delete-game', game.id)}
                        className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 ml-2"
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Invitations */}
              <div>
                <div className="text-gray-400 text-xs mb-2 uppercase tracking-wide">
                  Invitations ({mpInvites.length})
                </div>
                {mpInvites.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-2">No invitations</div>
                ) : (
                  mpInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-2 rounded border border-gray-700 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm truncate">
                          {invite.from.split('@')[0]} {'\u2192'} {invite.to.split('@')[0]}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {invite.status} - {formatDateShort(invite.createdAt)}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleMpAction('delete-invitation', invite.id)}
                        className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 ml-2"
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
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
