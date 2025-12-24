'use client';

// Debug Panel Component with Bug Reporting

import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Bug reporting panel
 * @param {Array} debugLog - Debug log entries
 * @param {Array} gameLog - Game event log
 * @param {Object} gameState - Current game state for bug reports
 */
export default function DebugPanel({
  debugLog = [],
  gameLog = [],
  gameState = {},
}) {
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugDescription, setBugDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmitBug = async () => {
    if (!bugDescription.trim()) {
      setSubmitStatus({ success: false, message: 'Please enter a description' });
      return;
    }

    setSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/bug-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: bugDescription,
          debugLog,
          gameLog,
          gameState,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus({ success: true, message: 'Bug report submitted successfully!' });
        setBugDescription('');
        setTimeout(() => {
          setShowBugModal(false);
          setSubmitStatus(null);
        }, 2000);
      } else {
        setSubmitStatus({ success: false, message: result.error || 'Failed to submit bug report' });
      }
    } catch (error) {
      setSubmitStatus({ success: false, message: 'Network error: ' + error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Bug Report Button - positioned top-left */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => setShowBugModal(true)}
          className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg border border-blue-600 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Report Bug
        </button>
      </div>

      {/* Bug Report Modal */}
      {showBugModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Report a Bug</h2>

            <p className="text-gray-300 text-sm mb-4">
              Describe what happened and what you expected. The game state and debug logs will be automatically included.
            </p>

            <textarea
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder="Describe the bug... (e.g., 'I was the dealer but couldn't count my crib after counting my hand')"
              className="w-full h-32 p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
            />

            {submitStatus && (
              <div className={`mt-3 p-2 rounded text-sm ${
                submitStatus.success ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'
              }`}>
                {submitStatus.message}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <Button
                onClick={() => {
                  setShowBugModal(false);
                  setBugDescription('');
                  setSubmitStatus(null);
                }}
                className="bg-gray-600 hover:bg-gray-700"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitBug}
                className="bg-red-600 hover:bg-red-700"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
