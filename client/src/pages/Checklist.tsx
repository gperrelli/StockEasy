import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ClipboardCheck, 
  Sun, 
  Moon, 
  Fan,
  Plus,
  Clock,
  User,
  Calendar,
  CheckCircle2,
  Circle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ChecklistType = 'abertura' | 'fechamento' | 'limpeza';

export default function Checklist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ChecklistType>('abertura');
  const [activeExecution, setActiveExecution] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const { data: templates } = useQuery({
    queryKey: ["/api/checklists/templates"],
  });

  const { data: executions } = useQuery({
    queryKey: ["/api/checklists/executions"],
  });

  const selectedTemplate = Array.isArray(templates) ? templates.find((t: any) => t.type === selectedType) : null;

  const startChecklistMutation = useMutation({
    mutationFn: (templateId: number) =>
      apiRequest("POST", "/api/checklists/executions", { templateId }),
    onSuccess: (execution) => {
      setActiveExecution(execution.id);
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/executions"] });
      toast({
        title: "Checklist iniciado",
        description: "Checklist iniciado com sucesso.",
      });
    },
  });

  const completeChecklistMutation = useMutation({
    mutationFn: ({ executionId, notes }: { executionId: number; notes: string }) =>
      apiRequest("PUT", `/api/checklists/executions/${executionId}/complete`, { notes }),
    onSuccess: () => {
      setActiveExecution(null);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/executions"] });
      toast({
        title: "Checklist concluído",
        description: "Checklist concluído com sucesso.",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ executionId, itemId, isCompleted, notes }: any) =>
      apiRequest("PUT", `/api/checklists/executions/${executionId}/items/${itemId}`, { 
        isCompleted, 
        notes 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/executions"] });
    },
  });

  const getActiveExecution = () => {
    if (!Array.isArray(executions)) return null;
    return executions.find((e: any) => 
      e.template.type === selectedType && !e.isCompleted
    );
  };

  const activeExecutionData = getActiveExecution();
  const isChecklistActive = activeExecutionData && activeExecution === activeExecutionData.id;

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

  const getTypeName = (type: ChecklistType) => {
    switch (type) {
      case 'abertura': return 'Abertura';
      case 'fechamento': return 'Fechamento';
      case 'limpeza': return 'Limpeza';
    }
  };

  const handleStartChecklist = () => {
    if (selectedTemplate) {
      startChecklistMutation.mutate(selectedTemplate.id);
    }
  };

  const handleCompleteChecklist = () => {
    if (activeExecutionData) {
      completeChecklistMutation.mutate({
        executionId: activeExecutionData.id,
        notes
      });
    }
  };

  const handleItemToggle = (itemId: number, isCompleted: boolean) => {
    if (activeExecutionData) {
      updateItemMutation.mutate({
        executionId: activeExecutionData.id,
        itemId,
        isCompleted,
        notes: ""
      });
    }
  };

  const completedItems = activeExecutionData?.items?.filter((item: any) => item.isCompleted)?.length || 0;
  const totalItems = activeExecutionData?.items?.length || 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const recentExecutions = Array.isArray(executions) ? executions.filter((e: any) => e.isCompleted).slice(0, 5) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Checklist de Rotinas</h1>
          <p className="text-muted-foreground">Gerencie os checklists diários da pizzaria</p>
        </div>
      </div>

      {/* Checklist Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['abertura', 'fechamento', 'limpeza'] as ChecklistType[]).map((type) => {
          const typeExecution = Array.isArray(executions) ? executions.find((e: any) => 
            e.template.type === type && !e.isCompleted
          ) : null;
          const isActive = selectedType === type;
          
          return (
            <Card 
              key={type} 
              className={`cursor-pointer transition-all ${
                isActive ? 'ring-2 ring-primary' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedType(type)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(type)}
                    <div>
                      <h3 className="font-medium">{getTypeName(type)}</h3>
                      <p className="text-sm text-muted-foreground">
                        Rotina de {type}
                      </p>
                    </div>
                  </div>
                  
                  {typeExecution && (
                    <Badge variant="default" className="bg-orange-500">
                      Em andamento
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Checklist */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getTypeIcon(selectedType)}
                <div>
                  <CardTitle>Checklist De {getTypeName(selectedType)}</CardTitle>
                  <p className="text-muted-foreground">
                    Execute os itens do checklist diário
                  </p>
                </div>
              </div>
              
              {!isChecklistActive ? (
                <Button 
                  onClick={handleStartChecklist}
                  className={getTypeColor(selectedType)}
                  disabled={startChecklistMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Iniciar Checklist
                </Button>
              ) : (
                <Button 
                  onClick={handleCompleteChecklist}
                  variant="outline"
                  disabled={completedItems < totalItems || completeChecklistMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Finalizar
                </Button>
              )}
            </div>
            
            {isChecklistActive && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso</span>
                  <span>{completedItems}/{totalItems} itens</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {!isChecklistActive ? (
              <div className="text-center py-8">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum checklist ativo para {selectedType}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Inicie um checklist para ver os itens
                </p>
              </div>
            ) : activeExecutionData?.items ? (
              <div className="space-y-4">
                {activeExecutionData.items.map((executionItem: any) => (
                  <div 
                    key={executionItem.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border ${
                      executionItem.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <Checkbox
                      checked={executionItem.isCompleted}
                      onCheckedChange={(checked) => 
                        handleItemToggle(executionItem.itemId, checked as boolean)
                      }
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-medium ${
                          executionItem.isCompleted ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {executionItem.item.title}
                        </h4>
                        {executionItem.item.isRequired && (
                          <Badge variant="secondary" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      
                      {executionItem.item.description && (
                        <p className={`text-sm ${
                          executionItem.isCompleted ? 'line-through text-muted-foreground' : 'text-muted-foreground'
                        }`}>
                          {executionItem.item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {executionItem.item.estimatedMinutes} min
                        </span>
                        <span>{executionItem.item.category}</span>
                      </div>
                      
                      {executionItem.isCompleted && executionItem.completedAt && (
                        <p className="text-xs text-green-600">
                          Concluído em {new Date(executionItem.completedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    {executionItem.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground mt-1" />
                    )}
                  </div>
                ))}
                
                {completedItems >= totalItems && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Checklist concluído!</h4>
                    <p className="text-sm text-blue-700 mb-3">
                      Adicione observações finais (opcional):
                    </p>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Digite observações sobre este checklist..."
                      className="mb-3"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando itens do checklist...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle>Execuções Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentExecutions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExecutions.map((execution: any) => (
                  <TableRow key={execution.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(execution.template.type)}
                        <span className="capitalize">{execution.template.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{execution.user.name}</TableCell>
                    <TableCell>
                      {new Date(execution.completedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {execution.notes && (
                        <span className="text-sm">{execution.notes}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma execução recente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}