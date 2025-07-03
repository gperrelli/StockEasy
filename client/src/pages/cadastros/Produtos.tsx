import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Package, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";

const productFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  unit: z.string().min(1, "Unidade é obrigatória"),
  currentStock: z.number().min(0, "Estoque deve ser positivo").default(0),
  minStock: z.number().min(0, "Estoque mínimo deve ser positivo").default(0),
  maxStock: z.number().optional(),
  costPrice: z.string().optional(),
  supplierId: z.number().optional(),
  categoryId: z.number().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function CadastroProdutos() {
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      unit: "",
      currentStock: 0,
      minStock: 0,
      maxStock: undefined,
      costPrice: "",
      supplierId: undefined,
      categoryId: undefined,
    },
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      const processedData = {
        ...data,
        supplierId: data.supplierId && data.supplierId.toString() !== "none" ? data.supplierId : null,
        categoryId: data.categoryId && data.categoryId.toString() !== "none" ? data.categoryId : null,
      };
      return apiRequest("POST", "/api/products", processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Produto criado",
        description: "O produto foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductFormData> }) => {
      const processedData = {
        ...data,
        supplierId: data.supplierId && data.supplierId.toString() !== "none" ? data.supplierId : null,
        categoryId: data.categoryId && data.categoryId.toString() !== "none" ? data.categoryId : null,
      };
      return apiRequest("PUT", `/api/products/${id}`, processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produto removido",
        description: "O produto foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description || "",
      unit: product.unit,
      currentStock: product.currentStock,
      minStock: product.minStock,
      maxStock: product.maxStock || undefined,
      costPrice: product.costPrice || "",
      supplierId: product.supplierId || undefined,
      categoryId: product.categoryId || undefined,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const filteredProducts = Array.isArray(products) ? products.filter((product: any) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  const lowStockProducts = Array.isArray(products) ? products.filter((product: any) => 
    product.currentStock <= product.minStock
  ) : [];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cadastro de Produtos</h1>
          <p className="text-gray-600">Gerencie o catálogo de produtos</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lowStockProducts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions and Search */}
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingProduct(null);
                form.reset({
                  name: "",
                  description: "",
                  unit: "",
                  currentStock: 0,
                  minStock: 0,
                  maxStock: undefined,
                  costPrice: "",
                  supplierId: undefined,
                  categoryId: undefined,
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct ? "Modifique as informações do produto nos campos abaixo." : "Preencha os campos abaixo para adicionar um novo produto ao estoque."}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do produto" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a unidade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unidade">Unidade</SelectItem>
                              <SelectItem value="kg">Kg</SelectItem>
                              <SelectItem value="litro">Litro</SelectItem>
                              <SelectItem value="pacote">Pacote</SelectItem>
                              <SelectItem value="caixa">Caixa</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descrição do produto" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="currentStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque Atual *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="minStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque Mínimo *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque Máximo</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                      name="supplierId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fornecedor</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o fornecedor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              {Array.isArray(suppliers) && suppliers.map((supplier: any) => (
                                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                  {supplier.name}
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
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))}
                            value={field.value?.toString() || "none"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma</SelectItem>
                              {Array.isArray(categories) && categories.map((category: any) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Custo</FormLabel>
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
                  
                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    >
                      {editingProduct ? "Atualizar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando produtos...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {searchQuery ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500">{product.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{product.currentStock}</span>
                          {product.currentStock <= product.minStock && (
                            <Badge variant="destructive" className="text-xs">
                              Baixo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.supplier?.name || "-"}</TableCell>
                      <TableCell>{product.category?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "default" : "secondary"}>
                          {product.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}