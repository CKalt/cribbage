'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Profile modal for setting user handle
 */
export default function ProfileModal({ isOpen, onClose }) {
  const { user, refreshAttributes } = useAuth();
  const [handle, setHandle] = useState('');
  const [currentHandle, setCurrentHandle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const userEmail = user?.attributes?.email || user?.username || '';

  // Fetch current profile on open
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      if (data.success) {
        setCurrentHandle(data.handle);
        setHandle(data.handle || '');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Live validation
  const getValidationError = () => {
    if (!handle.trim()) return null; // Don't show error for empty
    const trimmed = handle.trim();
    if (trimmed.length < 3) return 'At least 3 characters';
    if (trimmed.length > 20) return '20 characters max';
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return 'Letters, numbers, underscores only';
    if (trimmed.startsWith('_') || trimmed.endsWith('_')) return 'Cannot start or end with underscore';
    return null;
  };

  const validationError = getValidationError();
  const hasChanged = handle.trim() !== (currentHandle || '');
  const canSave = handle.trim().length >= 3 && !validationError && hasChanged;

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handle.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setCurrentHandle(data.handle);
        setSuccess('Handle saved!');
        // Refresh auth context to pick up new preferred_username
        if (refreshAttributes) {
          await refreshAttributes();
        }
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Email (read-only) */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm block mb-1">Email</label>
              <div className="text-gray-500 text-sm bg-gray-900 px-3 py-2 rounded border border-gray-700">
                {userEmail}
              </div>
            </div>

            {/* Handle input */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm block mb-1">Handle</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => {
                  setHandle(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
                placeholder="Choose a handle..."
                maxLength={20}
                className="w-full px-3 py-2 rounded border border-gray-600 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="flex justify-between mt-1">
                <div className="text-xs">
                  {validationError ? (
                    <span className="text-red-400">{validationError}</span>
                  ) : handle.trim().length >= 3 ? (
                    <span className="text-green-400">Looks good!</span>
                  ) : (
                    <span className="text-gray-500">Letters, numbers, underscores</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {handle.trim().length}/20
                </div>
              </div>
            </div>

            {/* Error/Success messages */}
            {error && (
              <div className="mb-4 p-2 rounded text-sm bg-red-900/50 text-red-300 border border-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-2 rounded text-sm bg-green-900/50 text-green-300 border border-green-700">
                {success}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Close
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
