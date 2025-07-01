import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
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

  const { data: templateItems } = useQuery({
    queryKey: ["/api/checklists/templates", selectedTemplate?.id, "items"],
    enabled: !!selectedTemplate?.id,
  });

  const selectedTemplate = templates?.find((t: any) => t.type === selectedType);
  const currentExecution = executions?.find((e: any) => 
    e.template.type === selectedType && !e.isCompleted
  );

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
  const totalItems = templateItems?.length || 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const recentExecutions = executions?.filter((e: any) => e.isCompleted).slice(0, 5);

  return (
    <Layout>
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
            const typeExecution = executions?.find((e: any) => 
              e.template.type === type && !e.isCompleted
            );
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
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isActive ? getTypeColor(type) : 'bg-muted'
                      }`}>
                        <span className={isActive ? 'text-white' : 'text-muted-foreground'}>
                          {getTypeIcon(type)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize">{type}</h3>
                        <p className="text-sm text-muted-foreground">
                          {type === 'abertura' && 'Rotina de abertura'}
                          {type === 'fechamento' && 'Rotina de fechamento'}
                          {type === 'limpeza' && 'Rotina de limpeza'}
                        </p>
                      </div>
                    </div>
                    
                    {typeExecution && (
                      <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                        Em andamento
                      </Badge>
                    )}
                  </div>
                  
                  {typeExecution && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progresso</span>
                        <span>{typeExecution.items?.filter((item: any) => item.isCompleted).length || 0}/{typeExecution.items?.length || 0}</span>
                      </div>
                      <Progress 
                        value={typeExecution.items?.length ? 
                          (typeExecution.items.filter((item: any) => item.isCompleted).length / typeExecution.items.length) * 100 
                          : 0
                        } 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Active Checklist */}
        {selectedType && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  {getTypeIcon(selectedType)}
                  <span className="ml-2 capitalize">Checklist de {selectedType}</span>
                </div>
                
                {!currentExecution && !activeExecution && (
                  <Button 
                    onClick={handleStartChecklist}
                    disabled={createExecutionMutation.isPending}
                    className={getTypeColor(selectedType)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Iniciar Checklist
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!currentExecution && !activeExecution ? (
                <div className="text-center py-8">
                  <ClipboardCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhum checklist ativo para {selectedType}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Progress */}
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-primary">Progresso</span>
                      <span className="text-sm text-primary">
                        {completedItems}/{totalItems} concluído
                      </span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-3">
                    {templateItems?.map((item: any) => {
                      const executionItem = currentExecution?.items?.find((ei: any) => ei.itemId === item.id);
                      
                      return (
                        <div key={item.id} className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
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
                            
                            <div className="mt-2 flex items-center space-x-3">
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
                  </div>

                  {/* Notes */}
                  <div className="mt-6">
                    <label className="text-sm font-medium block mb-2">Observações (opcional)</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Adicione observações sobre este checklist..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Iniciado às {new Date().toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center">
                        <User className="h-4 w-4 mr-1" />
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
            {recentExecutions && recentExecutions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-center">Status</TableHead>
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
                      <TableCell>
                        <div>
                          <p>{new Date(execution.completedAt).toLocaleDateString('pt-BR')}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(execution.completedAt).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{execution.user.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completo
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {execution.notes ? (
                          <span className="text-sm">{execution.notes}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
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
    </Layout>
  );
}
