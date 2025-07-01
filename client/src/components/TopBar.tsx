import { Button } from "@/components/ui/button";
import { Bell, Menu } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface TopBarProps {
  title: string;
  description: string;
  onMenuClick: () => void;
  onWhatsAppClick: () => void;
}

export default function TopBar({ title, description, onMenuClick, onWhatsAppClick }: TopBarProps) {
  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden mr-4"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notification Button */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </Button>
          
          {/* WhatsApp Button */}
          <Button 
            onClick={onWhatsAppClick}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <SiWhatsapp className="mr-2 h-4 w-4" />
            Gerar Lista WhatsApp
          </Button>
        </div>
      </div>
    </header>
  );
}
