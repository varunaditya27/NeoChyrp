"use client";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { createSupabaseBrowserClient } from './supabase-client';

import type { Session, User } from '@supabase/supabase-js';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Memoize client so we don't recreate it every render (prevents repeated auth subscriptions)
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSyncedToken = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const sess = data.session ?? null;
      setSession(sess);
      setLoading(false);
      if (sess?.access_token) await syncUserIfNeeded('INITIAL_LOAD', sess.access_token);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess);
      // Only sync on meaningful events; avoid spamming on every render
      if (sess?.access_token && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        await syncUserIfNeeded(event, sess.access_token);
      }
      if (event === 'SIGNED_OUT') {
        lastSyncedToken.current = null;
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, [supabase]);

  async function syncUserIfNeeded(reason: string, accessToken: string) {
    if (lastSyncedToken.current === accessToken) return; // dedupe identical token
    try {
      await fetch('/api/auth/sync', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'X-Sync-Reason': reason } });
      lastSyncedToken.current = accessToken;
    } catch (e) {
       
      console.warn('User sync failed', e);
    }
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
