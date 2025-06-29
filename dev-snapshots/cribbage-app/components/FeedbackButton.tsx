'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function FeedbackButton() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [issue, setIssue] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: name || 'Anonymous',
          issue,
          details
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setName('');
        setIssue('');
        setDetails('');
        setTimeout(() => {
          setShowForm(false);
          setMessage('');
        }, 3000);
      } else {
        setMessage('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      setMessage('Error submitting feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowForm(!showForm)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700"
      >
        Report Bug to Claude
      </Button>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Report a Bug to Claude</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Summary *
                </label>
                <input
                  type="text"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Details (optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  rows={4}
                  placeholder="Provide more details about what happened..."
                />
              </div>

              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.includes('Thank you') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {message}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={submitting || !issue}
                  className="flex-1"
                >
                  {submitting ? 'Submitting...' : 'Submit to Claude'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}