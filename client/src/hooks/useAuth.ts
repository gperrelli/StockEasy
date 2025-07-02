import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@shared/schema';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncAndFetchUser(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncAndFetchUser(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncAndFetchUser = async (supabaseUser: any) => {
    try {
      // First, sync user with our database
      const syncResponse = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: supabaseUser })
      });

      if (syncResponse.ok) {
        const { user: dbUser } = await syncResponse.json();
        setUser(dbUser);
      } else {
        console.error('Failed to sync user');
        setUser(null);
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signOut,
  };
}