import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building, Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (!companyName.trim()) {
      setError('Nome da empresa é obrigatório');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Create company if needed (simplified for demo - should be handled properly)
      const companyResponse = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: companyName,
          cnpj: cnpj || null,
          plan: 'basic'
        }),
      });

      let companyId = null;
      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        companyId = companyData.id;
      }

      // Step 2: Create user using AuthService (Supabase Auth + custom table)
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: email.split('@')[0], // Use part before @ as temporary name
          companyId,
          role: 'admin' // First user becomes admin of their company
        }),
      });

      const signupResult = await signupResponse.json();

      if (!signupResponse.ok) {
        setError(signupResult.message || 'Erro ao criar conta');
        return;
      }

      setSuccessMessage('Conta criada com sucesso! Verifique seu email para confirmar.');
      setIsSignUp(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setCompanyName('');
      setCnpj('');

    } catch (err: any) {
      console.error('Signup error:', err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError('Digite seu email para recuperar a senha');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
        setIsForgotPassword(false);
        setEmail('');
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {isForgotPassword ? 'Recuperar Senha' : isSignUp ? 'Criar Conta' : 'StockEasy'}
          </CardTitle>
          <CardDescription>
            {isForgotPassword ? 'Digite seu email para recuperar a senha' : isSignUp ? 'Crie sua conta para acessar o sistema' : 'Sistema de Gestão de Estoque'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isForgotPassword ? handleForgotPassword : isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            )}

            {isSignUp && !isForgotPassword && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirme a Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Digite o nome da sua empresa"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {error && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isForgotPassword ? 'Enviando...' : isSignUp ? 'Criando conta...' : 'Entrando...'}
                </>
              ) : (
                isForgotPassword ? 'Enviar Email de Recuperação' : isSignUp ? 'Criar Conta' : 'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {!isForgotPassword && (
              <>
                <Button
                  variant="link"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setSuccessMessage('');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setCompanyName('');
                    setCnpj('');
                  }}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Crie uma agora'}
                </Button>
                
                {!isSignUp && (
                  <div>
                    <Button
                      variant="link"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setSuccessMessage('');
                        setPassword('');
                      }}
                      disabled={loading}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Esqueceu sua senha?
                    </Button>
                  </div>
                )}
              </>
            )}
            
            {isForgotPassword && (
              <Button
                variant="link"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccessMessage('');
                  setEmail('');
                }}
                disabled={loading}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Voltar ao login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}