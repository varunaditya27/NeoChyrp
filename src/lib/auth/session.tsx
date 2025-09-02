"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

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
  const supabase = createSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const sess = data.session ?? null;
      setSession(sess);
      setLoading(false);
      if (sess?.access_token) await syncUser(sess.access_token);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.access_token) await syncUser(sess.access_token);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, [supabase]);

  async function syncUser(accessToken: string) {
    try {
      await fetch('/api/auth/sync', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
    } catch (e) {
      // eslint-disable-next-line no-console
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
