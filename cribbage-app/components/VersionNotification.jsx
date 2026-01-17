'use client';

/**
 * VersionNotification Component
 *
 * Checks for new versions and displays notification modals.
 * Can be used on any page (login, game, etc.)
 *
 * Shows two types of modals:
 * 1. "New Version Available!" - When server has newer version than client
 *    - Later button: dismisses temporarily
 *    - Upgrade Now button: reloads page to get new version
 *
 * 2. "What's New!" - When user loads fresh page but hasn't seen release notes
 *    - Got It! button: marks as seen in localStorage
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { APP_VERSION, VERSION_CHECK_INTERVAL_SECONDS, RELEASE_NOTE } from '@/lib/version';

const RELEASE_NOTES_SEEN_KEY = 'cribbage_release_notes_seen';

export default function VersionNotification() {
  const [modalState, setModalState] = useState(null); // { version, releaseNote, isNewLoad }

  useEffect(() => {
    const intervalMs = VERSION_CHECK_INTERVAL_SECONDS * 1000;

    const checkVersion = async () => {
      try {
        const response = await fetch('/api/version');
        if (response.ok) {
          const data = await response.json();
          const lastSeenVersion = localStorage.getItem(RELEASE_NOTES_SEEN_KEY);

          console.log('Version check:', {
            serverVersion: data.version,
            clientVersion: APP_VERSION,
            lastSeenVersion,
            hasReleaseNote: !!data.releaseNote
          });

          // If server has a newer version than client, show upgrade prompt
          if (data.version && data.version !== APP_VERSION) {
            console.log('Showing NEW VERSION AVAILABLE modal');
            setModalState({ version: data.version, releaseNote: data.releaseNote, isNewLoad: false });
          }
          // If versions match but user hasn't seen this version's release notes, show "What's New"
          else if (data.releaseNote && lastSeenVersion !== APP_VERSION) {
            console.log('Showing WHATS NEW modal');
            setModalState({ version: APP_VERSION, releaseNote: data.releaseNote, isNewLoad: true });
          }
        }
      } catch (error) {
        console.error('Version check failed:', error);
      }
    };

    // Check immediately on component mount
    checkVersion();

    // Then check periodically with randomized offset to spread server load
    const interval = setInterval(() => {
      const randomOffset = Math.random() * intervalMs;
      setTimeout(checkVersion, randomOffset);
    }, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleDismiss = () => {
    if (modalState?.isNewLoad) {
      // Mark this version's release notes as seen
      localStorage.setItem(RELEASE_NOTES_SEEN_KEY, APP_VERSION);
    }
    setModalState(null);
  };

  const handleUpgrade = () => {
    window.location.reload();
  };

  if (!modalState) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-blue-500 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-blue-400 mb-2">
          {modalState.isNewLoad ? "What's New!" : 'New Version Available!'}
        </h2>
        <p className="text-white font-mono text-sm mb-3 bg-gray-700 px-2 py-1 rounded inline-block">
          {modalState.version}
        </p>
        <div className="text-gray-300 text-sm mb-4 whitespace-pre-line leading-relaxed">
          {modalState.releaseNote}
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
          {modalState.isNewLoad ? (
            <Button
              onClick={handleDismiss}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Got It!
            </Button>
          ) : (
            <>
              <Button
                onClick={handleDismiss}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Later
              </Button>
              <Button
                onClick={handleUpgrade}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Upgrade Now
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
