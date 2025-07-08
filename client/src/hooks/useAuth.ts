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
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();
        
        // Handle refresh token errors
        if (error && error.message?.includes('refresh_token_not_found')) {
          console.log('Refresh token not found, clearing session');
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (supabaseUser && mounted) {
          await syncAndFetchUser(supabaseUser);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear any invalid session
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
      }
    };

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          await syncAndFetchUser(session.user);
        } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setLoading(false);
          }
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
      // Get fresh token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('No valid session:', sessionError);
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      // First, sync user with our database
      const syncResponse = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ user: supabaseUser })
      });

      if (syncResponse.ok) {
        const { user: dbUser } = await syncResponse.json();
        setUser(dbUser);
      } else {
        console.error('Failed to sync user');
        // If sync fails due to auth issues, sign out
        if (syncResponse.status === 401) {
          await supabase.auth.signOut();
        }
        setUser(null);
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
      // Clear session on any error
      await supabase.auth.signOut();
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