import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { 
  LayoutDashboard, 
  Package, 
  ArrowUpDown, 
  Truck, 
  ClipboardCheck, 
  BarChart3,
  Menu,
  X
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Produtos",
    href: "/products",
    icon: Package,
  },
  {
    name: "Movimentação",
    href: "/movements", 
    icon: ArrowUpDown,
  },
  {
    name: "Fornecedores",
    href: "/suppliers",
    icon: Truck,
  },
  {
    name: "Checklist",
    href: "/checklist",
    icon: ClipboardCheck,
  },
  {
    name: "Relatórios",
    href: "/reports",
    icon: BarChart3,
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary flex items-center">
              <Package className="mr-2 h-6 w-6" />
              StockEasy
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pizzaria do João
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary/10 text-primary border-r-4 border-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">JO</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">João Silva</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-card shadow-sm border-r border-border">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
