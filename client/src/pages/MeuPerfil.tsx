import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { LogOut, User, Mail, Building, Calendar, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MeuPerfil() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MASTER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'gerente':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'operador':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'MASTER':
        return 'Master SaaS';
      case 'admin':
        return 'Administrador';
      case 'gerente':
        return 'Gerente';
      case 'operador':
        return 'Operador';
      default:
        return role;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais</p>
        </div>
        <Button 
          onClick={handleLogout}
          variant="outline"
          className="flex items-center gap-2"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          {isLoggingOut ? 'Saindo...' : 'Logout'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Suas informações básicas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={user.name} />
                <AvatarFallback className="text-lg">
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-gray-600">{user.email}</p>
                <Badge className={`mt-2 ${getRoleColor(user.role)}`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={user.name}
                  disabled
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Empresa */}
        {user.companyId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Empresa
              </CardTitle>
              <CardDescription>
                Informações da sua empresa no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Building className="h-4 w-4" />
                <AlertDescription>
                  ID da Empresa: {user.companyId}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
            <CardDescription>
              Detalhes da sua conta no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Status da Conta</Label>
                <div className="mt-1">
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </div>
              <div>
                <Label>Data de Cadastro</Label>
                <Input
                  value={new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  disabled
                  className="mt-1"
                />
              </div>
            </div>
            
            {user.supabaseUserId && (
              <div>
                <Label>ID de Autenticação</Label>
                <Input
                  value={user.supabaseUserId}
                  disabled
                  className="mt-1 font-mono text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão de Logout destacado */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Zona de Perigo</CardTitle>
            <CardDescription className="text-red-600">
              Ações que afetam sua sessão no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fazendo logout...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair do Sistema
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}