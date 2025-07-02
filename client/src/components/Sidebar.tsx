import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Package, 
  ArrowUpDown, 
  Truck, 
  ClipboardCheck, 
  BarChart3,
  Menu,
  X,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Settings,
  UserPlus,
  Building,
  Tag,
  List,
  Crown,
  Shield
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation: Array<{
  name: string;
  href?: string;
  icon: any;
  current?: boolean;
  isExpandable?: boolean;
  subItems?: Array<{
    name: string;
    href: string;
    icon: any;
  }>;
}> = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Cadastros",
    icon: FolderOpen,
    isExpandable: true,
    subItems: [
      {
        name: "Produtos",
        href: "/cadastros/produtos",
        icon: Package,
      },
      {
        name: "Fornecedores", 
        href: "/cadastros/fornecedores",
        icon: Truck,
      },
      {
        name: "Categorias",
        href: "/cadastros/categorias", 
        icon: Tag,
      },
      {
        name: "Checklist",
        href: "/cadastros/checklist",
        icon: List,
      },
      {
        name: "Usuários",
        href: "/cadastros/usuarios",
        icon: UserPlus,
      },
    ]
  },
  {
    name: "Movimentação",
    href: "/movements", 
    icon: ArrowUpDown,
  },
  {
    name: "Checklist",
    href: "/checklist",
    icon: ClipboardCheck,
  },
  {
    name: "Operações",
    href: "/operations",
    icon: Settings,
  },
  {
    name: "Relatórios",
    href: "/reports",
    icon: BarChart3,
  },
];

// Super Admin navigation for system administrators
const superAdminNavigation: Array<{
  name: string;
  href?: string;
  icon: any;
  isExpandable?: boolean;
  subItems?: Array<{
    name: string;
    href: string;
    icon: any;
  }>;
}> = [
  {
    name: "Super Admin",
    icon: Crown,
    isExpandable: true,
    subItems: [
      {
        name: "Empresas",
        href: "/super-admin/empresas",
        icon: Building,
      },
      {
        name: "Configurações",
        href: "/super-admin/settings",
        icon: Settings,
      },
    ]
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const [location] = useLocation();
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [superAdminOpen, setSuperAdminOpen] = useState(false);
  
  // Get user from auth context
  const { user } = useAuth();
  const userRole = user?.role || "operador";
  const isMaster = userRole === "MASTER";
  const isAdmin = userRole === "admin" || isMaster;
  
  // Filter navigation based on user role
  const getFilteredNavigation = () => {
    const baseNav = [...navigation];
    
    // Add MASTER navigation for MASTER users only
    if (isMaster) {
      baseNav.unshift({
        name: "MASTER Panel",
        href: "/master/dashboard",
        icon: Crown,
        current: location === "/master/dashboard",
      });
    }
    
    return baseNav;
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center">
          <div>
            <h1 className="text-xl font-bold text-primary flex items-center">
              <Package className="mr-2 h-6 w-6" />
              StockEasy
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pizzaria do João
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-6">
        <ul className="space-y-2 px-4">
          {getFilteredNavigation().map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            if (item.isExpandable) {
              const isOpen = item.name === "Cadastros" ? cadastrosOpen : 
                            item.name === "Super Admin" ? superAdminOpen : false;
              const toggleOpen = item.name === "Cadastros" ? 
                                () => setCadastrosOpen(!cadastrosOpen) :
                                () => setSuperAdminOpen(!superAdminOpen);
              
              return (
                <li key={item.name}>
                  <div>
                    <button
                      onClick={toggleOpen}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                        item.name === "Super Admin" 
                          ? "text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                        {item.name === "Super Admin" && (
                          <Shield className="ml-2 h-3 w-3" />
                        )}
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {isOpen && item.subItems && (
                      <ul className="ml-4 mt-2 space-y-1 border-l-2 border-border pl-4">
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location === subItem.href;
                          
                          return (
                            <li key={subItem.name}>
                              <Link href={subItem.href}>
                                <div
                                  className={cn(
                                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                                    isSubActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                  )}
                                  onClick={onClose}
                                >
                                  <SubIcon className="mr-3 h-4 w-4" />
                                  {subItem.name}
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </li>
              );
            }
            
            return (
              <li key={item.name}>
                <Link href={item.href!}>
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
