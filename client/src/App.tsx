import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Movements from "@/pages/Movements";
import Suppliers from "@/pages/Suppliers";
import Checklist from "@/pages/Checklist";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/products" component={Products} />
      <Route path="/movements" component={Movements} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/checklist" component={Checklist} />
      <Route path="/login" component={Login} />
      {/* Reports page would go here when implemented */}
      <Route path="/reports" component={() => <div>Reports coming soon...</div>} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
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
