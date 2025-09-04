"use client";
import React, { useEffect, useState, useCallback } from 'react';

interface Challenge {
  token: string;
  prompt: string;
  ttl: number;
  disabled?: boolean;
}

interface MaptchaProps {
  onChange: (data: { token?: string; answer?: string }) => void;
  className?: string;
}

export const Maptcha: React.FC<MaptchaProps> = ({ onChange, className = '' }) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const base = process.env.NEXT_PUBLIC_SITE_URL || '';
      const res = await fetch(`${base}/api/captcha`);
      const json = await res.json();
      setChallenge(json.data || null);
      setAnswer('');
      onChange({ token: json.data?.token, answer: '' });
    } catch (e: any) {
      setError('Failed to load captcha');
    } finally { setLoading(false); }
  }, [onChange]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    onChange({ token: challenge?.token, answer });
  }, [answer, challenge?.token, onChange]);

  if (challenge?.disabled) return null; // captcha globally disabled

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-xs font-medium text-gray-600">
        <span>Captcha</span>
        <button type="button" onClick={load} disabled={loading} className="text-[11px] text-blue-600 hover:underline disabled:opacity-50">{loading ? '…' : 'Refresh'}</button>
      </div>
      {error && <div className="text-[11px] text-red-600">{error}</div>}
      {challenge && !error && (
        <div className="flex items-center gap-2">
          <span className="rounded bg-gray-100 px-2 py-1 text-[11px] font-mono tracking-wide text-gray-700">{challenge.prompt}</span>
          <input
            aria-label="Captcha answer"
            inputMode="numeric"
            className="w-20 rounded border-gray-300 px-2 py-1 text-[11px] focus:border-blue-500 focus:ring-blue-500"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Ans"
            required
          />
        </div>
      )}
    </div>
  );
};

export default Maptcha;
