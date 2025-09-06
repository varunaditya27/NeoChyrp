"use client";

import React, { useEffect, useState } from 'react';

import { useAuth } from '@/src/lib/auth/session';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<{ displayName: string; bio: string; avatarUrl?: string } | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, loading, router]);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({ displayName: data.user.displayName || '', bio: data.user.bio || '', avatarUrl: data.user.avatarUrl || '' });
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    }
  }

  async function uploadAvatarIfNeeded() {
    if (!avatarFile) return profile?.avatarUrl || undefined;
    const fd = new FormData();
    fd.append('file', avatarFile);
    const res = await fetch('/api/assets/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || !data?.data?.url) throw new Error(data?.error || 'Upload failed');
    return data.data.url as string;
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      const avatarUrl = await uploadAvatarIfNeeded();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: profile.displayName, bio: profile.bio, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update profile');
      alert('Profile updated');
      setAvatarFile(null);
    } catch (e:any) {
      alert(e.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 size-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Edit Profile</h3>
                <div className="mt-1 text-sm text-green-700">Update your personal information</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-start gap-6">
              <div>
                <div className="size-20 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                  {avatarFile ? (
                    <img alt="avatar preview" src={URL.createObjectURL(avatarFile)} className="size-full object-cover" />
                  ) : profile.avatarUrl ? (
                    <img alt="avatar" src={profile.avatarUrl} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-gray-400">No Avatar</div>
                  )}
                </div>
                <label className="mt-3 inline-block cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                  Change Avatar
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Display Name</label>
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
