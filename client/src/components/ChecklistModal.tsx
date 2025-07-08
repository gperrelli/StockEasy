import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, Sun, Moon, Fan, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChecklistModalProps {
  open: boolean;
  onClose: () => void;
}

type ChecklistType = 'abertura' | 'fechamento' | 'limpeza';

export default function ChecklistModal({ open, onClose }: ChecklistModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ChecklistType>('abertura');
  const [activeExecution, setActiveExecution] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const { data: templates } = useQuery({
    queryKey: ["/api/checklists/templates"],
    enabled: open,
  });

  const { data: executions } = useQuery({
    queryKey: ["/api/checklists/executions"],
    enabled: open,
  });

  const selectedTemplate = Array.isArray(templates) ? templates.find((t: any) => t.type === selectedType) : null;
  
  const { data: templateItems } = useQuery({
    queryKey: ["/api/checklists/templates", selectedTemplate?.id, "items"],
    enabled: open && !!selectedTemplate?.id,
  });
  
  const currentExecution = Array.isArray(executions) ? executions.find((e: any) => 
    e.template?.type === selectedType && !e.isCompleted
  ) : null;

  const createExecutionMutation = useMutation({
    mutationFn: (templateId: number) =>
      apiRequest("POST", "/api/checklists/executions", { templateId }),
    onSuccess: async (response) => {
      const data = await response.json();
      setActiveExecution(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/executions"] });
      toast({
        title: "Checklist iniciado",
        description: "O checklist foi iniciado com sucesso.",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ executionId, itemId, isCompleted, notes }: any) =>
      apiRequest("PUT", `/api/checklists/executions/${executionId}/items/${itemId}`, {
        isCompleted,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/executions"] });
    },
  });

  const completeExecutionMutation = useMutation({
    mutationFn: (executionId: number) =>
      apiRequest("PUT", `/api/checklists/executions/${executionId}/complete`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/executions"] });
      setActiveExecution(null);
      setNotes("");
      toast({
        title: "Checklist finalizado",
        description: "O checklist foi finalizado com sucesso.",
      });
    },
  });

  const handleStartChecklist = () => {
    if (selectedTemplate) {
      createExecutionMutation.mutate(selectedTemplate.id);
    }
  };

  const handleItemToggle = (itemId: number, isCompleted: boolean) => {
    const executionId = currentExecution?.id || activeExecution;
    if (executionId) {
      updateItemMutation.mutate({
        executionId,
        itemId,
        isCompleted,
        notes: "",
      });
    }
  };

  const handleCompleteChecklist = () => {
    const executionId = currentExecution?.id || activeExecution;
    if (executionId) {
      completeExecutionMutation.mutate(executionId);
    }
  };

  const getTypeIcon = (type: ChecklistType) => {
    switch (type) {
      case 'abertura': return <Sun className="h-4 w-4" />;
      case 'fechamento': return <Moon className="h-4 w-4" />;
      case 'limpeza': return <Fan className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: ChecklistType) => {
    switch (type) {
      case 'abertura': return 'bg-blue-600 hover:bg-blue-700';
      case 'fechamento': return 'bg-purple-600 hover:bg-purple-700';
      case 'limpeza': return 'bg-green-600 hover:bg-green-700';
    }
  };

  const completedItems = currentExecution?.items?.filter((item: any) => item.isCompleted)?.length || 0;
  const totalItems = Array.isArray(templateItems) ? templateItems.length : 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ClipboardCheck className="text-primary mr-2 h-5 w-5" />
            Checklist Diário - {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Gerencie checklists operacionais para abertura, fechamento e limpeza.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex h-96">
          {/* Sidebar with checklist types */}
          <div className="w-1/3 border-r border-border p-4 bg-muted/30">
            <h4 className="font-medium mb-4">Tipos de Checklist</h4>
            <div className="space-y-2">
              {['abertura', 'fechamento', 'limpeza'].map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    selectedType === type ? getTypeColor(type as ChecklistType) : ""
                  }`}
                  onClick={() => setSelectedType(type as ChecklistType)}
                >
                  {getTypeIcon(type as ChecklistType)}
                  <span className="ml-2 capitalize">{type}</span>
                </Button>
              ))}
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {!currentExecution && !activeExecution ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Nenhum checklist ativo para {selectedType}
                </p>
                <Button 
                  onClick={handleStartChecklist}
                  disabled={createExecutionMutation.isPending}
                  className={getTypeColor(selectedType)}
                >
                  Iniciar Checklist
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(templateItems) && templateItems.map((item: any) => {
                  const executionItem = currentExecution?.items?.find((ei: any) => ei.itemId === item.id);
                  
                  return (
                    <div key={item.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                      <Checkbox
                        checked={executionItem?.isCompleted || false}
                        onCheckedChange={(checked) => handleItemToggle(item.id, checked as boolean)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        )}
                        
                        <div className="mt-2 flex items-center space-x-2">
                          {item.category && (
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          )}
                          {item.estimatedMinutes && (
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {item.estimatedMinutes} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Progress */}
                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-primary">Progresso</span>
                    <span className="text-sm text-primary">
                      {completedItems}/{totalItems} concluído
                    </span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <label className="text-sm font-medium">Observações (opcional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre este checklist..."
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {(currentExecution || activeExecution) && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Iniciado às {new Date().toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
              <span className="text-sm text-muted-foreground">
                por João Silva
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                Salvar Progresso
              </Button>
              <Button 
                onClick={handleCompleteChecklist}
                disabled={completeExecutionMutation.isPending || completedItems < totalItems}
                className={getTypeColor(selectedType)}
              >
                Finalizar Checklist
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
