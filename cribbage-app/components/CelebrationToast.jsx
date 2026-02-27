'use client';

// Lightweight toast for celebration phrases + micro-animations
// Non-blocking, auto-dismiss, accessible

import { useEffect, useState, useCallback } from 'react';

/**
 * CelebrationToast — displays a phrase with optional animation.
 * @param {Object} props
 * @param {string|null} props.phrase - Text to display
 * @param {Object|null} props.animation - Animation metadata from the pool
 * @param {Function} props.onDismiss - Called when toast finishes
 */
export default function CelebrationToast({ phrase, animation, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      if (onDismiss) onDismiss();
    }, 400);
  }, [onDismiss]);

  useEffect(() => {
    if (!phrase) return;
    setVisible(true);
    setExiting(false);

    // Auto-dismiss after display duration
    const displayMs = animation ? Math.max(2500, animation.durationMs + 1000) : 2500;
    const timer = setTimeout(dismiss, displayMs);
    return () => clearTimeout(timer);
  }, [phrase, animation, dismiss]);

  if (!visible || !phrase) return null;

  // Build animation class for the toast wrapper
  const animClass = animation?.anchor === 'toast' ? animation.cssClass : '';

  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      aria-live="polite"
      role="status"
    >
      <div
        className={`
          bg-gray-900/90 text-amber-200 px-5 py-3 rounded-xl
          border border-amber-500/30 shadow-lg text-center
          text-sm sm:text-base max-w-xs sm:max-w-sm
          transition-all duration-300
          ${exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
          ${animClass}
        `}
      >
        {phrase}
      </div>

      {/* Score panel animation anchor — rendered but invisible, positioned near top */}
      {animation?.anchor === 'scorePanel' && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 pointer-events-none ${animation.cssClass}`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
