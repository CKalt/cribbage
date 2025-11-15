'use client';

/**
 * CopyLogButton component - Copies game logs to clipboard as JSONL
 */

import { useState } from 'react';
import { useGameContext } from '@/contexts/GameContext';

export default function CopyLogButton() {
  const { getGameLogs } = useGameContext();
  const [copied, setCopied] = useState(false);

  const handleCopyLogs = async () => {
    const logs = getGameLogs();

    if (!logs) {
      alert('No logs to copy yet!');
      return;
    }

    try {
      await navigator.clipboard.writeText(logs);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy logs:', err);
      alert('Failed to copy logs to clipboard');
    }
  };

  return (
    <button
      onClick={handleCopyLogs}
      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold border-2 border-purple-800 shadow-lg"
    >
      {copied ? '✓ Copied!' : '📋 Copy Game Log'}
    </button>
  );
}
