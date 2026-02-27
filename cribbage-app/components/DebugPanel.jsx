'use client';

// Debug Panel Component with Bug Reporting

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Bug reporting panel
 * @param {Array} debugLog - Debug log entries
 * @param {Array} gameLog - Game event log
 * @param {Object} gameState - Current game state for bug reports
 * @param {boolean} showBugModalExternal - External trigger to show modal
 * @param {Function} onBugModalClose - Callback when modal closes
 */
export default function DebugPanel({
  debugLog = [],
  gameLog = [],
  gameState = {},
  showBugModalExternal = false,
  onBugModalClose = () => {},
  userEmail = 'unknown',
}) {
  const [showBugModal, setShowBugModal] = useState(false);
  const fileInputRef = useRef(null);

  // Handle external trigger
  useEffect(() => {
    if (showBugModalExternal) {
      setShowBugModal(true);
    }
  }, [showBugModalExternal]);
  const [bugDescription, setBugDescription] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSubmitStatus({ success: false, message: 'Please select an image file' });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSubmitStatus({ success: false, message: 'Screenshot must be less than 5MB' });
        return;
      }

      setScreenshot(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitBug = async () => {
    if (!bugDescription.trim()) {
      setSubmitStatus({ success: false, message: 'Please enter a description' });
      return;
    }

    setSubmitting(true);
    setSubmitStatus(null);

    try {
      // Use the already-read base64 preview data (avoids iOS stale File reference error)
      const screenshotData = screenshotPreview || null;

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
          userEmail,
          screenshot: screenshotData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitStatus({ success: true, message: 'Bug report submitted successfully!' });
        setBugDescription('');
        setScreenshot(null);
        setScreenshotPreview(null);
        setTimeout(() => {
          setShowBugModal(false);
          setSubmitStatus(null);
          onBugModalClose();
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

  const handleClose = () => {
    setShowBugModal(false);
    setBugDescription('');
    setScreenshot(null);
    setScreenshotPreview(null);
    setSubmitStatus(null);
    onBugModalClose();
  };

  return (
    <>
      {/* Bug Report Modal */}
      {showBugModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
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

            {/* Screenshot upload */}
            <div className="mt-4">
              <label className="block text-gray-300 text-sm mb-2">
                Attach Screenshot (optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="hidden"
                id="screenshot-input"
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-600 hover:bg-gray-700 text-sm"
                >
                  {screenshot ? 'Change Screenshot' : 'Add Screenshot'}
                </Button>
                {screenshot && (
                  <Button
                    type="button"
                    onClick={removeScreenshot}
                    className="bg-red-600 hover:bg-red-700 text-sm"
                  >
                    Remove
                  </Button>
                )}
              </div>
              {screenshotPreview && (
                <div className="mt-3">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="max-w-full max-h-40 rounded border border-gray-600"
                  />
                </div>
              )}
            </div>

            {submitStatus && (
              <div className={`mt-3 p-2 rounded text-sm ${
                submitStatus.success ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'
              }`}>
                {submitStatus.message}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <Button
                onClick={handleClose}
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
