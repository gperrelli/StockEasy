import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Crown, 
  Building2, 
  Users, 
  Shield, 
  Search,
  Plus,
  UserCheck,
  UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MasterUser {
  id: number;
  name: string;
  email: string;
  role: string;
  companyId: number | null;
  companyName: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Company {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export default function MasterDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { toast } = useToast();

  // Fetch all companies
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/master/companies"],
  });

  // Fetch all users across all companies
  const { data: allUsers = [], isLoading } = useQuery<MasterUser[]>({
    queryKey: ["/api/master/users"],
  });

  // Assign company to user mutation
  const assignCompanyMutation = useMutation({
    mutationFn: ({ userId, companyId, role }: { userId: number; companyId: number; role: string }) =>
      apiRequest("POST", `/api/master/users/${userId}/assign-company`, { companyId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/master/users"] });
      toast({
        title: "Usuário atualizado",
        description: "Empresa e role atribuídos com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter users based on search query
  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.companyName && user.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAssignCompany = (userId: number) => {
    if (!selectedCompany || !selectedRole) {
      toast({
        title: "Seleção incompleta",
        description: "Selecione uma empresa e um role.",
        variant: "destructive",
      });
      return;
    }

    assignCompanyMutation.mutate({
      userId,
      companyId: selectedCompany,
      role: selectedRole
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'MASTER':
        return <Badge variant="destructive" className="bg-purple-600"><Crown className="h-3 w-3 mr-1" />MASTER</Badge>;
      case 'admin':
        return <Badge variant="destructive"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'gerente':
        return <Badge variant="secondary">Gerente</Badge>;
      case 'operador':
        return <Badge variant="outline">Operador</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const stats = {
    totalUsers: allUsers.length,
    totalCompanies: companies.length,
    activeUsers: allUsers.filter(u => u.isActive).length,
    masterUsers: allUsers.filter(u => u.role === 'MASTER').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Crown className="mr-3 h-8 w-8 text-purple-600" />
            Painel MASTER
          </h1>
          <p className="text-muted-foreground">
            Gerencie empresas e usuários do sistema
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Empresas cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MASTER Users</CardTitle>
            <Crown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.masterUsers}</div>
            <p className="text-xs text-muted-foreground">
              Usuários MASTER
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
          
          {/* Assignment Controls */}
          <div className="flex gap-4 items-center pt-4">
            <Select value={selectedCompany?.toString() || ""} onValueChange={(value) => setSelectedCompany(parseInt(value))}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
              </SelectContent>
            </Select>

            <p className="text-sm text-muted-foreground">
              Selecione empresa e role, depois clique em "Atribuir" para o usuário desejado.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Carregando usuários...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      {user.companyName ? (
                        <span className="text-sm">{user.companyName}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem empresa</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="outline" className="text-green-600">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600">
                          <UserX className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.role !== 'MASTER' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssignCompany(user.id)}
                          disabled={!selectedCompany || !selectedRole || assignCompanyMutation.isPending}
                        >
                          Atribuir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}