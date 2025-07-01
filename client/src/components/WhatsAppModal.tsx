import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Info, Send, Phone } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WhatsAppModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WhatsAppModal({ open, onClose }: WhatsAppModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [activeTab, setActiveTab] = useState("list");

  const { data: whatsappData, isLoading } = useQuery({
    queryKey: ["/api/whatsapp/shopping-list"],
    enabled: open,
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ["/api/suppliers"],
    enabled: open,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { phoneNumber: string; message: string }) =>
      apiRequest("POST", "/api/whatsapp/send-message", data),
    onSuccess: () => {
      toast({
        title: "Mensagem enviada!",
        description: "A lista foi enviada via WhatsApp Business API.",
      });
      setPhoneNumber("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: error?.message || "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    },
  });

  const sendShoppingListMutation = useMutation({
    mutationFn: (data: { suppliers: Array<{ phoneNumber: string; supplierName: string }> }) =>
      apiRequest("POST", "/api/whatsapp/send-shopping-list", data),
    onSuccess: (data: any) => {
      const { summary } = data;
      toast({
        title: "Listas enviadas!",
        description: `${summary.sent} de ${summary.total} fornecedores receberam a lista.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar listas",
        description: error?.message || "Não foi possível enviar as listas.",
        variant: "destructive",
      });
    },
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

  const handleSendMessage = async () => {
    if (!phoneNumber.trim() || !whatsappData?.text) return;
    
    sendMessageMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      message: whatsappData.text,
    });
  };

  const handleSendToSuppliers = async () => {
    if (!suppliers || !Array.isArray(suppliers)) return;

    // Get suppliers with phone numbers
    const suppliersWithPhone = suppliers
      .filter((supplier: any) => supplier.phone && supplier.phone.trim())
      .map((supplier: any) => ({
        phoneNumber: supplier.phone,
        supplierName: supplier.name,
      }));

    if (suppliersWithPhone.length === 0) {
      toast({
        title: "Nenhum fornecedor encontrado",
        description: "Nenhum fornecedor possui número de telefone cadastrado.",
        variant: "destructive",
      });
      return;
    }

    sendShoppingListMutation.mutate({ suppliers: suppliersWithPhone });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <SiWhatsapp className="text-green-600 mr-2 h-5 w-5" />
            WhatsApp Business API
          </DialogTitle>
          <DialogDescription>
            Gerar e enviar lista de produtos com estoque baixo via WhatsApp Business API
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">
              <Copy className="mr-2 h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="send" disabled>
              <Send className="mr-2 h-4 w-4" />
              Enviar Mensagem
            </TabsTrigger>
            <TabsTrigger value="suppliers" disabled>
              <Phone className="mr-2 h-4 w-4" />
              Enviar aos Fornecedores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="send" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  🚧 Funcionalidade em Desenvolvimento
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  A integração direta com WhatsApp Business API estará disponível em breve.
                  Por enquanto, use a aba "Lista" para copiar e enviar manualmente.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                  🚧 Funcionalidade em Desenvolvimento
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  O envio automatizado para fornecedores via WhatsApp Business API estará disponível em breve.
                  Por enquanto, use a aba "Lista" para copiar e enviar manualmente para cada fornecedor.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
