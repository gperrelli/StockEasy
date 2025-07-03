import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Settings, 
  Sun, 
  Moon, 
  Fan, 
  Edit, 
  Trash2,
  Clock,
  AlertCircle
} from "lucide-react";

type ChecklistType = 'abertura' | 'fechamento' | 'limpeza';

const checklistItemSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  estimatedMinutes: z.number().min(1).max(120).default(5),
  order: z.number().min(0).default(0),
  isRequired: z.boolean().default(true),
});

type ChecklistItemFormData = z.infer<typeof checklistItemSchema>;

export default function CadastroChecklist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<ChecklistType>('abertura');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<ChecklistItemFormData>({
    resolver: zodResolver(checklistItemSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      estimatedMinutes: 5,
      order: 0,
      isRequired: true,
    },
  });

  // Buscar templates
  const { data: templates } = useQuery({
    queryKey: ["/api/checklists/templates"],
  });

  // Buscar template selecionado
  const selectedTemplate = Array.isArray(templates) 
    ? templates.find((t: any) => t.type === selectedType) 
    : null;

  // Buscar itens do template selecionado
  const { data: templateItems } = useQuery({
    queryKey: ["/api/checklists/templates", selectedTemplate?.id, "items"],
    enabled: !!selectedTemplate?.id,
  });

  // Criar item
  const createItemMutation = useMutation({
    mutationFn: (data: ChecklistItemFormData) =>
      apiRequest("POST", "/api/checklists/items", {
        ...data,
        templateId: selectedTemplate?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/checklists/templates", selectedTemplate?.id, "items"] 
      });
      setDialogOpen(false);
      form.reset();
      toast({
        title: "Item criado",
        description: "Item do checklist criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar item do checklist.",
        variant: "destructive",
      });
    },
  });

  // Editar item
  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChecklistItemFormData }) =>
      apiRequest("PUT", `/api/checklists/items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/checklists/templates", selectedTemplate?.id, "items"] 
      });
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
      toast({
        title: "Item atualizado",
        description: "Item do checklist atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar item do checklist.",
        variant: "destructive",
      });
    },
  });

  // Deletar item
  const deleteItemMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/checklists/items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/checklists/templates", selectedTemplate?.id, "items"] 
      });
      toast({
        title: "Item removido",
        description: "Item do checklist removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao remover item do checklist.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ChecklistItemFormData) => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      createItemMutation.mutate(data);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      description: item.description || "",
      category: item.category,
      estimatedMinutes: item.estimatedMinutes || 5,
      order: item.order || 0,
      isRequired: item.isRequired ?? true,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este item?")) {
      deleteItemMutation.mutate(id);
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

  const categories = [
    "Equipamentos",
    "Cozinha", 
    "Estoque",
    "Limpeza",
    "Segurança",
    "Atendimento",
    "Financeiro",
    "Geral"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cadastro de Checklists</h1>
        <p className="text-muted-foreground">
          Configure os itens dos checklists de rotina operacional.
        </p>
      </div>

      {/* Seleção do Tipo de Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['abertura', 'fechamento', 'limpeza'] as ChecklistType[]).map((type) => (
          <Card 
            key={type} 
            className={`cursor-pointer transition-all ${
              selectedType === type ? 'ring-2 ring-primary' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedType(type)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedType === type ? getTypeColor(type) + ' text-white' : 'bg-muted'
                }`}>
                  {getTypeIcon(type)}
                </div>
                <div>
                  <h3 className="font-semibold capitalize">{type}</h3>
                  <p className="text-sm text-muted-foreground">
                    {templateItems && Array.isArray(templateItems) ? templateItems.length : 0} itens
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Itens do Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                {getTypeIcon(selectedType)}
                <span className="ml-2 capitalize">Itens - Checklist de {selectedType}</span>
              </CardTitle>
              <CardDescription>
                Configure os itens que devem ser verificados no checklist de {selectedType}.
              </CardDescription>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingItem(null);
                  form.reset({
                    title: "",
                    description: "",
                    category: "",
                    estimatedMinutes: 5,
                    order: Array.isArray(templateItems) ? templateItems.length : 0,
                    isRequired: true,
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Item
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Editar Item" : "Novo Item"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem 
                      ? "Modifique as informações do item do checklist." 
                      : "Adicione um novo item ao checklist de " + selectedType + "."}
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Verificar equipamentos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detalhes sobre o que deve ser verificado..."
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estimatedMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tempo (min)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                max="120"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createItemMutation.isPending || updateItemMutation.isPending}
                      >
                        {editingItem ? "Atualizar" : "Criar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          {!selectedTemplate ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Template de checklist não encontrado para {selectedType}.
              </p>
            </div>
          ) : !templateItems || !Array.isArray(templateItems) || templateItems.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum item configurado para este checklist.
              </p>
              <p className="text-sm text-muted-foreground">
                Clique em "Novo Item" para começar a configurar os itens de verificação.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {templateItems && Array.isArray(templateItems) && templateItems.map((item: any, index: number) => (
                <div 
                  key={item.id} 
                  className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg"
                >
                  <div className="text-sm text-muted-foreground font-mono">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">{item.title}</h4>
                      {item.isRequired && (
                        <Badge variant="destructive" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.estimatedMinutes}min
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}