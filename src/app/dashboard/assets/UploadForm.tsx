"use client";
import React, { useState } from 'react';

export default function UploadForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError(null); setSuccess(false);
    const form = e.currentTarget;
    const fileInput = form.querySelector('input[name="file"]') as HTMLInputElement;
    if (!fileInput?.files?.[0]) { setError('Select a file'); setBusy(false); return; }
    const fd = new FormData();
    fd.append('file', fileInput.files[0]);
    try {
      const token = (window as any).supabase?.auth?.getSession ? (await (window as any).supabase.auth.getSession()).data.session?.access_token : null;
      const res = await fetch('/api/assets/upload', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      setSuccess(true);
      form.reset();
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded border border-gray-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Select File</label>
        <input type="file" name="file" className="block w-full text-sm" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Uploaded.</p>}
      <button disabled={busy} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{busy ? 'Uploading...' : 'Upload'}</button>
    </form>
  );
}
