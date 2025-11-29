// Game Message Component
// Will be populated in Phase 4.3

/**
 * Displays game status messages
 * @param {string} message - The message to display
 */
export default function GameMessage({ message }) {
  if (!message) return null;

  return (
    <div className="text-center mb-4 text-yellow-300 text-lg">
      {message}
    </div>
  );
}
