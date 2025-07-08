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
import { Copy, Info, Send, Phone, CheckCircle, AlertCircle } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WhatsAppModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WhatsAppModal({ open, onClose }: WhatsAppModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("bulk");

  const { data: bulkData, isLoading, refetch } = useQuery({
    queryKey: ["/api/whatsapp/generate-bulk-list"],
    enabled: open,
  });

  const sendDirectMutation = useMutation({
    mutationFn: (supplierId: number) => apiRequest("POST", "/api/whatsapp/send-shopping-list", { supplierId }),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Mensagem enviada!",
          description: data.message,
        });
      } else {
        toast({
          title: "Mensagem gerada",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive",
      });
    },
  });

  const handleCopyToClipboard = async (text: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
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

  const handleSendDirect = (supplierId: number) => {
    sendDirectMutation.mutate(supplierId);
  };

  const handleOpenWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const suppliers = bulkData?.suppliers || [];
  const hasSuppliers = suppliers.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SiWhatsapp className="h-5 w-5 text-green-600" />
            WhatsApp - Lista de Compras
          </DialogTitle>
          <DialogDescription>
            Envie listas de produtos com estoque baixo diretamente para seus fornecedores via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bulk">Envio em Massa</TabsTrigger>
            <TabsTrigger value="info">Informações</TabsTrigger>
          </TabsList>

          <TabsContent value="bulk" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Gerando listas de compras...</p>
              </div>
            ) : !hasSuppliers ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum produto com estoque baixo</h3>
                <p className="text-muted-foreground">
                  Todos os produtos estão com estoque adequado ou não há fornecedores cadastrados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    {suppliers.length} fornecedor{suppliers.length !== 1 ? 'es' : ''} com produtos em baixo estoque
                  </h3>
                  <Button onClick={() => refetch()} variant="outline" size="sm">
                    Atualizar
                  </Button>
                </div>

                <div className="grid gap-4">
                  {suppliers.map((supplier: any) => (
                    <Card key={supplier.supplier.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{supplier.supplier.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {supplier.hasPhone ? (
                                <Badge variant="outline" className="text-green-600">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {supplier.supplier.phone}
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Sem telefone
                                </Badge>
                              )}
                              <Badge variant="secondary">
                                {supplier.productCount} produto{supplier.productCount !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyToClipboard(supplier.text)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {supplier.hasPhone && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenWhatsApp(supplier.supplier.phone, supplier.text)}
                                >
                                  <SiWhatsapp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSendDirect(supplier.supplier.id)}
                                  disabled={sendDirectMutation.isPending}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Enviar
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted/50 rounded-md p-3">
                          <pre className="text-sm whitespace-pre-wrap font-mono">
                            {supplier.text}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Como funciona a integração WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">🚀 Modo Desenvolvimento</h4>
                  <p className="text-sm text-muted-foreground">
                    A integração WhatsApp Business API está em fase de desenvolvimento. 
                    No momento, você pode copiar as mensagens e enviar manualmente ou 
                    usar o botão do WhatsApp Web.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">📱 Funcionalidades Disponíveis</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Geração automática de listas de compras por fornecedor</li>
                    <li>• Cópia para área de transferência</li>
                    <li>• Abertura direta no WhatsApp Web</li>
                    <li>• Filtro por produtos com estoque baixo</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">🔮 Próximas Funcionalidades</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Envio automático via WhatsApp Business API</li>
                    <li>• Confirmação de entrega</li>
                    <li>• Templates personalizáveis</li>
                    <li>• Histórico de mensagens enviadas</li>
                  </ul>
                </div>

                <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950 p-3 rounded">
                  <p className="text-sm">
                    <strong>Dica:</strong> Para melhor experiência, cadastre os números de telefone 
                    dos fornecedores no formato (XX) XXXXX-XXXX.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}