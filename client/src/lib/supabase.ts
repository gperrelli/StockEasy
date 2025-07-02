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

// Configuração de Real-time subscriptions
export const createRealtimeSubscription = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: table,
        filter: filter
      },
      callback
    )
    .subscribe();
    
  return channel;
};

// Função para invalidar cache quando dados mudam em tempo real
export const setupRealtimeUpdates = (invalidateQueries: (queryKey: string) => void) => {
  // Subscription para tabela users
  const usersChannel = createRealtimeSubscription('users', (payload) => {
    console.log('Users table changed:', payload);
    invalidateQueries('/api/users');
    invalidateQueries('/api/master/users');
  });

  // Subscription para tabela companies  
  const companiesChannel = createRealtimeSubscription('companies', (payload) => {
    console.log('Companies table changed:', payload);
    invalidateQueries('/api/master/companies');
  });

  // Subscription para tabela products
  const productsChannel = createRealtimeSubscription('products', (payload) => {
    console.log('Products table changed:', payload);
    invalidateQueries('/api/products');
    invalidateQueries('/api/products/low-stock');
    invalidateQueries('/api/dashboard/stats');
  });

  // Subscription para tabela stock_movements
  const movementsChannel = createRealtimeSubscription('stock_movements', (payload) => {
    console.log('Stock movements table changed:', payload);
    invalidateQueries('/api/movements');
    invalidateQueries('/api/dashboard/stats');
  });

  return () => {
    // Cleanup function para remover subscriptions
    usersChannel.unsubscribe();
    companiesChannel.unsubscribe();
    productsChannel.unsubscribe();
    movementsChannel.unsubscribe();
  };
};
