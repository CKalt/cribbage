// Game Message Component

/**
 * Displays game status messages
 * @param {string} message - The message to display
 * @param {string} variant - Message variant ('default' | 'large')
 */
export default function GameMessage({ message, variant = 'default' }) {
  if (!message) return null;

  if (variant === 'large') {
    return (
      <div className="text-lg mb-4 text-yellow-300">
        {message}
      </div>
    );
  }

  return (
    <div className="text-center mb-4 text-yellow-300 text-lg">
      {message}
    </div>
  );
}
