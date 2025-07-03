import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { setupRealtimeUpdates } from "./lib/supabase";

// Components
import Layout from "@/components/Layout";

// Pages
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Movements from "@/pages/Movements";
import Suppliers from "@/pages/Suppliers";
import Checklist from "@/pages/Checklist";
import MeuPerfil from "@/pages/MeuPerfil";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

// Cadastros Pages
import CadastroCategorias from "@/pages/cadastros/Categorias";
import CadastroUsuarios from "@/pages/cadastros/Usuarios";
import CadastroProdutos from "@/pages/cadastros/Produtos";
import CadastroFornecedores from "@/pages/cadastros/Fornecedores";
import CadastroChecklist from "@/pages/cadastros/Checklist";

// Super Admin Pages
import SuperAdminEmpresas from "@/pages/super-admin/Empresas";
import MasterDashboard from "@/pages/master/Dashboard";
import Operations from "@/pages/Operations";

function AuthenticatedApp() {
  // Setup real-time updates quando o usuário está autenticado
  useEffect(() => {
    const invalidateQuery = (queryKey: string) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    };

    const cleanup = setupRealtimeUpdates(invalidateQuery);
    
    console.log('Real-time subscriptions ativadas');
    
    return cleanup; // Cleanup quando componente desmonta
  }, []);

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/products" component={Products} />
        <Route path="/movements" component={Movements} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/checklist" component={Checklist} />
        <Route path="/operations" component={Operations} />
        <Route path="/meu-perfil" component={MeuPerfil} />
        
        {/* Cadastros Routes */}
        <Route path="/cadastros/categorias" component={CadastroCategorias} />
        <Route path="/cadastros/usuarios" component={CadastroUsuarios} />
        <Route path="/cadastros/produtos" component={CadastroProdutos} />
        <Route path="/cadastros/fornecedores" component={CadastroFornecedores} />
        <Route path="/cadastros/checklist" component={CadastroChecklist} />
        
        {/* MASTER Routes */}
        <Route path="/master/dashboard" component={MasterDashboard} />
        
        {/* Super Admin Routes */}
        <Route path="/super-admin/empresas" component={SuperAdminEmpresas} />
        
        {/* Reports page would go here when implemented */}
        <Route path="/reports" component={() => <div>Reports coming soon...</div>} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
