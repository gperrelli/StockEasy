import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@shared/schema';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Check current auth state
    const initializeAuth = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (supabaseUser && mounted) {
          await syncAndFetchUser(supabaseUser);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          await syncAndFetchUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
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