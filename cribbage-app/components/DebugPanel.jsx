'use client';

// Debug Panel Component

import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Debug and replay controls panel
 * @param {Array} debugLog - Debug log entries
 * @param {Array} gameLog - Game event log
 * @param {function} onCopyLog - Copy game log to clipboard
 * @param {function} onLoadReplay - Load replay from JSON
 * @param {boolean} replayMode - Whether in replay mode
 * @param {number} replayIndex - Current replay position
 * @param {number} replayLength - Total replay events
 * @param {function} onNextEvent - Advance replay
 */
export default function DebugPanel({
  debugLog = [],
  gameLog = [],
  onCopyLog,
  onLoadReplay,
  replayMode = false,
  replayIndex = 0,
  replayLength = 0,
  onNextEvent,
}) {
  const [showDebugLog, setShowDebugLog] = useState(false);
  const [showGameLog, setShowGameLog] = useState(false);

  return (
    <>
      {/* Debug Log Toggle Buttons */}
      <div className="text-center mt-4 space-x-2">
        <Button
          onClick={() => setShowDebugLog(!showDebugLog)}
          className="bg-gray-600 hover:bg-gray-700 text-sm"
        >
          {showDebugLog ? 'Hide' : 'Show'} Debug Log
        </Button>

        <Button
          onClick={() => setShowGameLog(!showGameLog)}
          className="bg-purple-600 hover:bg-purple-700 text-sm"
        >
          {showGameLog ? 'Hide' : 'Show'} Game Log
        </Button>

        {gameLog.length > 0 && (
          <Button
            onClick={onCopyLog}
            className="bg-blue-600 hover:bg-blue-700 text-sm"
          >
            Copy Game Log
          </Button>
        )}

        <Button
          onClick={onLoadReplay}
          className="bg-green-600 hover:bg-green-700 text-sm"
        >
          Load Replay
        </Button>

        {replayMode && (
          <Button
            onClick={onNextEvent}
            className="bg-yellow-600 hover:bg-yellow-700 text-sm"
          >
            Next Event ({replayIndex}/{replayLength})
          </Button>
        )}
      </div>

      {/* Debug Log Display */}
      {showDebugLog && debugLog.length > 0 && (
        <div className="mt-4 p-2 bg-gray-800 rounded text-xs font-mono max-h-40 overflow-y-auto">
          <div className="text-yellow-400 mb-1">Debug Log:</div>
          {debugLog.slice(-10).map((log, idx) => (
            <div key={idx} className="text-gray-300">{log}</div>
          ))}
        </div>
      )}

      {/* Game Log Display */}
      {showGameLog && gameLog.length > 0 && (
        <div className="mt-4 p-2 bg-purple-900 rounded text-xs font-mono max-h-60 overflow-y-auto">
          <div className="text-yellow-400 mb-1">Game Event Log ({gameLog.length} events):</div>
          {gameLog.slice(-20).map((event, idx) => (
            <div key={idx} className="text-gray-300 mb-2">
              <div className="text-green-400">[{new Date(event.timestamp).toLocaleTimeString()}] {event.type}</div>
              <div className="ml-4">{JSON.stringify(event.data, null, 2)}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
