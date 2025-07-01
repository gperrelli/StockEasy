import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import WhatsAppModal from "./WhatsAppModal";
import ChecklistModal from "./ChecklistModal";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);

  const currentPageTitle = {
    "/": "Dashboard",
    "/products": "Produtos", 
    "/movements": "Movimentação",
    "/suppliers": "Fornecedores",
    "/checklist": "Checklist",
    "/reports": "Relatórios",
  }[location] || "Dashboard";

  const currentPageDescription = {
    "/": "Visão geral do estoque",
    "/products": "Gerenciar produtos e estoque",
    "/movements": "Histórico de movimentações",
    "/suppliers": "Gerenciar fornecedores",
    "/checklist": "Checklist de rotinas",
    "/reports": "Relatórios e análises",
  }[location] || "Visão geral do estoque";

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <main className="flex-1 overflow-auto">
        <TopBar 
          title={currentPageTitle}
          description={currentPageDescription}
          onMenuClick={() => setSidebarOpen(true)}
          onWhatsAppClick={() => setWhatsAppModalOpen(true)}
        />
        
        <div className="p-6">
          {children}
        </div>
      </main>

      <WhatsAppModal 
        open={whatsAppModalOpen} 
        onClose={() => setWhatsAppModalOpen(false)}
      />
      
      <ChecklistModal
        open={checklistModalOpen}
        onClose={() => setChecklistModalOpen(false)}
      />
    </div>
  );
}
