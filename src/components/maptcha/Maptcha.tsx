'use client';

import { useEffect, useState } from 'react';

interface MaptchaChallenge {
  question: string;
  token: string;
}

interface MaptchaProps {
  onChange?: (token: string, answer: string) => void;
  onValidation?: (isValid: boolean) => void;
  className?: string;
}

export function Maptcha({ onChange, onValidation, className = '' }: MaptchaProps) {
  const [challenge, setChallenge] = useState<MaptchaChallenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState<boolean | null>(null);

  // Generate new challenge on mount
  useEffect(() => {
    generateChallenge();
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (challenge && answer && onChange) {
      onChange(challenge.token, answer);
    }
  }, [challenge, answer, onChange]);

  async function generateChallenge() {
    setLoading(true);
    setError(null);
    setValidated(null);
    setAnswer('');

    try {
      const response = await fetch('/api/maptcha');
      const result = await response.json();

      if (result.success) {
        setChallenge(result.data);
      } else {
        setError('Failed to load challenge');
      }
    } catch (err) {
      setError('Failed to load challenge');
      console.error('Maptcha generation error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function validateAnswer() {
    if (!challenge || !answer.trim()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/maptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: challenge.token,
          answer: answer.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        const isValid = result.data.valid;
        setValidated(isValid);

        if (onValidation) {
          onValidation(isValid);
        }

        // If invalid, generate new challenge
        if (!isValid) {
          setTimeout(() => {
            generateChallenge();
          }, 1000);
        }
      } else {
        setError('Validation failed');
      }
    } catch (err) {
      setError('Validation failed');
      console.error('Maptcha validation error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setAnswer(value);
    setValidated(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateAnswer();
    }
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button
            onClick={generateChallenge}
            className="text-xs text-red-600 hover:text-red-800 underline"
            disabled={loading}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50 p-3 ${className}`}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Math Challenge (spam prevention)
        </label>

        {loading && (
          <div className="text-sm text-gray-500">Loading challenge...</div>
        )}

        {challenge && !loading && (
          <div className="space-y-2">
            <div className="text-lg font-mono text-gray-900">
              What is {challenge.question}?
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={answer}
                onChange={handleAnswerChange}
                onKeyDown={handleKeyDown}
                placeholder="Your answer"
                className="w-20 rounded border border-gray-300 px-2 py-1 text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={loading || validated === true}
              />

              <button
                onClick={validateAnswer}
                disabled={!answer.trim() || loading || validated === true}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Check'}
              </button>

              <button
                onClick={generateChallenge}
                disabled={loading}
                className="rounded bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                title="Generate new challenge"
              >
                🔄
              </button>
            </div>

            {validated === true && (
              <div className="text-sm text-green-600 font-medium">
                ✓ Correct! You can now submit your comment.
              </div>
            )}

            {validated === false && (
              <div className="text-sm text-red-600">
                ✗ Incorrect answer. Try the new challenge above.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
