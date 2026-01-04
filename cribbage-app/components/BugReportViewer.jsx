'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Bug Report Viewer Modal
 * Shows user's bug reports and any replies from developers
 */
export default function BugReportViewer({
  isOpen,
  onClose,
  userEmail,
  onUnreadCountChange
}) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(null); // report id to confirm

  // Fetch reports when modal opens or view changes
  useEffect(() => {
    if (isOpen && userEmail) {
      fetchReports();
    }
  }, [isOpen, userEmail, showArchived]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/bug-reports?email=${encodeURIComponent(userEmail)}${showArchived ? '&archived=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
        // Only update unread count from active reports
        if (onUnreadCountChange && !showArchived) {
          onUnreadCountChange(data.unreadCount);
        }
      } else {
        setError(data.error || 'Failed to load reports');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const archiveReport = async (reportId) => {
    try {
      const response = await fetch(`/api/bug-reports/${reportId}/archive`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        // Remove from local state and refresh
        setReports(prev => prev.filter(r => r.id !== reportId));
        setArchiveConfirm(null);
        setExpandedId(null);
        // Refresh to update counts
        fetchReports();
      } else {
        setError(data.error || 'Failed to archive report');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    }
  };

  const markAsSeen = async (reportId) => {
    try {
      await fetch(`/api/bug-reports/${reportId}/seen`, { method: 'POST' });
      // Update local state
      setReports(prev => prev.map(r =>
        r.id === reportId ? { ...r, seenByUser: true, hasUnreadReplies: false } : r
      ));
      // Update unread count
      if (onUnreadCountChange) {
        const newUnreadCount = reports.filter(r => r.id !== reportId && r.hasUnreadReplies).length;
        onUnreadCountChange(newUnreadCount);
      }
    } catch (err) {
      console.error('Failed to mark as seen:', err);
    }
  };

  const toggleExpand = (reportId) => {
    if (expandedId === reportId) {
      setExpandedId(null);
    } else {
      setExpandedId(reportId);
      // Mark as seen when expanded
      const report = reports.find(r => r.id === reportId);
      if (report && report.hasUnreadReplies) {
        markAsSeen(reportId);
      }
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-4 max-w-lg w-full mx-4 shadow-xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-white">My Bug Reports</h2>
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
            onClick={() => setShowArchived(false)}
            className={`px-3 py-1 text-sm rounded ${
              !showArchived
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-3 py-1 text-sm rounded ${
              showArchived
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Archived
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-8">{error}</div>
          ) : reports.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              {showArchived ? 'No archived reports.' : 'No bug reports submitted yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <div
                  key={report.id}
                  className={`rounded border ${
                    report.hasUnreadReplies
                      ? 'border-red-500 bg-gray-700'
                      : 'border-gray-600 bg-gray-750'
                  }`}
                >
                  {/* Report Header - Clickable */}
                  <button
                    onClick={() => toggleExpand(report.id)}
                    className="w-full text-left p-3 flex items-start gap-2"
                  >
                    {/* Unread indicator */}
                    {report.hasUnreadReplies && (
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-gray-400 text-xs">
                          {formatDate(report.timestamp)}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          report.type === 'AUTO_STUCK_STATE'
                            ? 'bg-yellow-900 text-yellow-300'
                            : 'bg-blue-900 text-blue-300'
                        }`}>
                          {report.type === 'AUTO_STUCK_STATE' ? 'Stuck' : 'Manual'}
                        </span>
                      </div>
                      <p className="text-white text-sm mt-1 truncate">
                        {report.description}
                      </p>
                      {report.replies.length > 0 && (
                        <p className="text-green-400 text-xs mt-1">
                          {report.replies.length} reply{report.replies.length > 1 ? 'ies' : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-gray-500 text-lg">
                      {expandedId === report.id ? '▼' : '▶'}
                    </span>
                  </button>

                  {/* Expanded Content */}
                  {expandedId === report.id && (
                    <div className="px-3 pb-3 border-t border-gray-600">
                      {/* Full Description */}
                      <div className="mt-3">
                        <div className="text-gray-400 text-xs mb-1">Your report:</div>
                        <p className="text-gray-300 text-sm whitespace-pre-wrap">
                          {report.fullDescription}
                        </p>
                      </div>

                      {/* Replies */}
                      {report.replies.length > 0 && (
                        <div className="mt-3 space-y-2">
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

                      {/* Report ID and Archive button */}
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-gray-500 text-xs">
                          Report ID: {report.id}
                        </span>
                        {!showArchived && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setArchiveConfirm(report.id);
                            }}
                            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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

        {/* Archive Confirmation Dialog */}
        {archiveConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center rounded-lg">
            <div className="bg-gray-700 rounded-lg p-4 max-w-xs w-full mx-4">
              <h3 className="text-white font-bold mb-2">Archive Report?</h3>
              <p className="text-gray-300 text-sm mb-4">
                This will move the report to your archive. You can view it later in the Archived tab.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setArchiveConfirm(null)}
                  className="bg-gray-600 hover:bg-gray-500 text-sm px-3 py-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => archiveReport(archiveConfirm)}
                  className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1"
                >
                  Archive
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
