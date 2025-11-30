'use client';

import { useEffect } from 'react';

export default function PasswordRequirements({ password, onValidationChange }) {
  const requirements = [
    { key: 'minLength', label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { key: 'uppercase', label: 'At least one uppercase letter (A-Z)', test: (pwd) => /[A-Z]/.test(pwd) },
    { key: 'lowercase', label: 'At least one lowercase letter (a-z)', test: (pwd) => /[a-z]/.test(pwd) },
    { key: 'number', label: 'At least one number (0-9)', test: (pwd) => /[0-9]/.test(pwd) },
    { key: 'special', label: 'At least one special character (!@#$%^&*)', test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd) }
  ];

  const requirementsMet = requirements.map(req => ({ ...req, met: req.test(password || '') }));
  const allRequirementsMet = requirementsMet.every(req => req.met);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(allRequirementsMet);
    }
  }, [allRequirementsMet, onValidationChange]);

  return (
    <div className="my-2 p-3 bg-gray-100 rounded border border-gray-200">
      <div className="text-sm font-semibold text-gray-700 mb-2">Password Requirements:</div>
      <ul className="list-none p-0 m-0">
        {requirementsMet.map((req) => (
          <li key={req.key} className={`flex items-center py-1 text-sm ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
            <span className="w-5 font-bold mr-2">{req.met ? '✓' : '○'}</span>
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
