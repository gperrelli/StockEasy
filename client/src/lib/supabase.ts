import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    company_id?: number;
  };
};

export const authHelpers = {
  getCurrentUser: () => supabase.auth.getUser(),
  signIn: (email: string, password: string) => 
    supabase.auth.signInWithPassword({ email, password }),
  signUp: (email: string, password: string, options?: { data?: any }) =>
    supabase.auth.signUp({ email, password, options }),
  signOut: () => supabase.auth.signOut(),
  onAuthStateChange: (callback: (event: string, session: any) => void) =>
    supabase.auth.onAuthStateChange(callback),
};
