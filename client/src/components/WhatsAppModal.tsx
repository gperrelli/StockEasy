import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Info } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WhatsAppModal({ open, onClose }: WhatsAppModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: whatsappData, isLoading } = useQuery({
    queryKey: ["/api/whatsapp/shopping-list"],
    enabled: open,
  });

  const handleCopyToClipboard = async () => {
    if (!whatsappData?.text) return;

    try {
      await navigator.clipboard.writeText(whatsappData.text);
      setCopied(true);
      toast({
        title: "Lista copiada!",
        description: "A lista foi copiada para a área de transferência.",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a lista.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <SiWhatsapp className="text-green-600 mr-2 h-5 w-5" />
            Lista para WhatsApp
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-muted-foreground">Gerando lista...</p>
            </div>
          ) : whatsappData?.text ? (
            <div className="bg-muted rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
              {whatsappData.text}
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-muted-foreground">Nenhum produto com estoque baixo encontrado.</p>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Info className="text-primary h-4 w-4" />
            <span className="text-sm text-muted-foreground">
              Lista agrupada por fornecedor
            </span>
          </div>
          
          <Button 
            onClick={handleCopyToClipboard}
            disabled={!whatsappData?.text || copied}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Copy className="mr-2 h-4 w-4" />
            {copied ? "Copiado!" : "Copiar Lista"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
