'use client';

// Celebration toast — displays phrase text + micro-animations
// All animation anchors now render visibly: toast effects on the text,
// score/hand/fullscreen effects as an overlay element near the toast.

import { useEffect, useState, useRef } from 'react';

/**
 * CelebrationToast — displays a phrase with visible animation.
 * @param {Object} props
 * @param {string|null} props.phrase - Text to display
 * @param {Object|null} props.animation - Animation metadata from the pool
 * @param {Function} props.onDismiss - Called when toast finishes
 */
export default function CelebrationToast({ phrase, animation, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const onDismissRef = useRef(onDismiss);
  const dismissedRef = useRef(false);
  onDismissRef.current = onDismiss;

  const dismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      if (onDismissRef.current) onDismissRef.current();
    }, 400);
  };

  useEffect(() => {
    if (!phrase) return;
    setVisible(true);
    setExiting(false);
    dismissedRef.current = false;

    // Auto-dismiss after display duration — use ref so timer doesn't reset on re-renders
    const displayMs = animation ? Math.max(1800, animation.durationMs + 500) : 1800;
    const timer = setTimeout(dismiss, displayMs);
    return () => clearTimeout(timer);
  }, [phrase]); // Only re-run when phrase changes, not on every render

  if (!visible || !phrase) return null;

  // Apply animation CSS class to the toast itself regardless of anchor type.
  // This makes confetti, sparkles, glows etc. all visible on or near the toast.
  const animClass = animation?.cssClass || '';

  // Determine if this animation has overlay effects (pseudo-elements like ::before/::after)
  // that need a larger visible container above the toast
  const hasOverlayEffects = animation && ['scorePanel', 'handCards', 'fullscreen'].includes(animation.anchor);

  return (
    <div
      onClick={dismiss}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 cursor-pointer"
      aria-live="polite"
      role="status"
    >
      {/* Overlay element for animations with pseudo-elements (confetti, sparkles, etc.) */}
      {hasOverlayEffects && (
        <div
          className={`absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-10 ${animClass}`}
          aria-hidden="true"
        />
      )}

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
        <div className="text-[10px] text-amber-400/50 mt-1">tap to dismiss</div>
      </div>
    </div>
  );
}
