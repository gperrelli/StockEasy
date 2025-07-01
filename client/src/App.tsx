import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Components
import Layout from "@/components/Layout";

// Pages
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Movements from "@/pages/Movements";
import Suppliers from "@/pages/Suppliers";
import Checklist from "@/pages/Checklist";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

// Cadastros Pages
import CadastroCategorias from "@/pages/cadastros/Categorias";
import CadastroUsuarios from "@/pages/cadastros/Usuarios";
import CadastroProdutos from "@/pages/cadastros/Produtos";
import CadastroFornecedores from "@/pages/cadastros/Fornecedores";

// Super Admin Pages
import SuperAdminEmpresas from "@/pages/super-admin/Empresas";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/products" component={Products} />
        <Route path="/movements" component={Movements} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/checklist" component={Checklist} />
        <Route path="/login" component={Login} />
        
        {/* Cadastros Routes */}
        <Route path="/cadastros/categorias" component={CadastroCategorias} />
        <Route path="/cadastros/usuarios" component={CadastroUsuarios} />
        <Route path="/cadastros/produtos" component={CadastroProdutos} />
        <Route path="/cadastros/fornecedores" component={CadastroFornecedores} />
        
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
