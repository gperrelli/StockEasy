import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
  Plus, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  Package,
  Settings,
  Minus
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertStockMovementSchema } from "@shared/schema";
import { z } from "zod";

const movementFormSchema = insertStockMovementSchema.omit({
  userId: true,
  companyId: true,
});

type MovementFormData = z.infer<typeof movementFormSchema>;

export default function Movements() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMovementType, setSelectedMovementType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ["/api/movements"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      productId: 0,
      type: selectedMovementType,
      quantity: 1,
      unitPrice: "",
      totalPrice: "",
      notes: "",
    },
  });

  const createMovementMutation = useMutation({
    mutationFn: (data: MovementFormData) => apiRequest("POST", "/api/movements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Movimentação registrada",
        description: "A movimentação foi registrada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar movimentação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: MovementFormData) => {
    // Calculate total price if unit price is provided
    const finalData = {
      ...data,
      totalPrice: data.unitPrice && data.quantity 
        ? (parseFloat(data.unitPrice.toString()) * data.quantity).toString()
        : data.totalPrice,
    };
    createMovementMutation.mutate(finalData);
  };

  const filteredMovements = movements?.filter((movement: any) => {
    const matchesSearch = movement.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || movement.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getMovementIcon = (type: string) => {
    switch(type) {
      case 'entrada':
        return <TrendingUp className="text-green-600 h-4 w-4" />;
      case 'saida':
        return <TrendingDown className="text-red-600 h-4 w-4" />;
      case 'ajuste':
        return <Settings className="text-blue-600 h-4 w-4" />;
      default:
        return <ArrowUpDown className="text-gray-600 h-4 w-4" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch(type) {
      case 'entrada':
        return 'text-green-600';
      case 'saida':
        return 'text-red-600';
      case 'ajuste':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const openMovementDialog = (type: 'entrada' | 'saida' | 'ajuste') => {
    setSelectedMovementType(type);
    form.reset({
      productId: 0,
      type: type,
      quantity: 1,
      unitPrice: "",
      totalPrice: "",
      notes: "",
    });
    setIsAddDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button 
            onClick={() => openMovementDialog('entrada')}
            className="bg-green-600 hover:bg-green-700"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Entrada
          </Button>
          <Button 
            onClick={() => openMovementDialog('saida')}
            className="bg-red-600 hover:bg-red-700"
          >
            <Minus className="h-4 w-4 mr-2" />
            Saída
          </Button>
          <Button 
            onClick={() => openMovementDialog('ajuste')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Ajuste
          </Button>
        </div>

        <Dialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen}
        >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  Registrar {selectedMovementType === 'entrada' ? 'Entrada' : 
                            selectedMovementType === 'saida' ? 'Saída' : 'Ajuste'} de Estoque
                </DialogTitle>
                <DialogDescription>
                  {selectedMovementType === 'entrada' 
                    ? 'Registre uma entrada de produtos no estoque.'
                    : selectedMovementType === 'saida'
                    ? 'Registre uma saída de produtos do estoque.'
                    : 'Registre um ajuste manual no estoque.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto *</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o produto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(products) && products.map((product: any) => (
                              product.id ? (
                                <SelectItem key={product.id} value={product.id.toString()}>
                                  {product.name} (Estoque: {product.currentStock} {product.unit})
                                </SelectItem>
                              ) : null
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo de movimentação" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="entrada">Entrada</SelectItem>
                              <SelectItem value="saida">Saída</SelectItem>
                              <SelectItem value="ajuste">Ajuste</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Unitário</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="totalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Total</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Observações sobre a movimentação" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createMovementMutation.isPending}
                    >
                      Registrar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
        </Dialog>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar movimentações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Movements Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowUpDown className="h-5 w-5 mr-2" />
              Histórico de Movimentações ({filteredMovements?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {movementsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-muted rounded" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements?.map((movement: any) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {new Date(movement.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(movement.createdAt).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{movement.product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={movement.type === 'entrada' ? 'default' : 'destructive'}
                          className="flex items-center w-fit mx-auto"
                        >
                          {getMovementIcon(movement.type)}
                          <span className="ml-1 capitalize">{movement.type}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${getMovementColor(movement.type)}`}>
                          {movement.type === 'entrada' ? '+' : '-'}{movement.quantity} {movement.product.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {movement.totalPrice ? (
                          <span className="font-medium">
                            R$ {parseFloat(movement.totalPrice).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{movement.user.name}</span>
                      </TableCell>
                      <TableCell>
                        {movement.notes ? (
                          <span className="text-sm">{movement.notes}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
