import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Clear any existing invalid session on component mount
  useEffect(() => {
    const clearInvalidSession = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error && error.message?.includes('refresh_token_not_found')) {
          await supabase.auth.signOut();
        }
      } catch (err) {
        console.log('Cleared invalid session');
      }
    };

    clearInvalidSession();
  }, []);
}