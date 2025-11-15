/**
 * MessageDisplay component - Displays game messages to the player
 */

interface MessageDisplayProps {
  message: string;
}

export default function MessageDisplay({ message }: MessageDisplayProps) {
  return (
    <div className="bg-yellow-100 p-4 rounded-lg mb-6 text-center font-semibold text-lg border-2 border-yellow-600">
      {message}
    </div>
  );
}
