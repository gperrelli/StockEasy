import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Truck, 
  Edit, 
  Trash2, 
  Search,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertSupplierSchema } from "@shared/schema";
import { z } from "zod";

const supplierFormSchema = insertSupplierSchema.omit({
  companyId: true,
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

export default function Suppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data: SupplierFormData) => apiRequest("POST", "/api/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Fornecedor adicionado",
        description: "O fornecedor foi adicionado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SupplierFormData> }) =>
      apiRequest("PUT", `/api/suppliers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setEditingSupplier(null);
      form.reset();
      toast({
        title: "Fornecedor atualizado",
        description: "O fornecedor foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({
        title: "Fornecedor removido",
        description: "O fornecedor foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: SupplierFormData) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este fornecedor?")) {
      deleteSupplierMutation.mutate(id);
    }
  };

  const filteredSuppliers = suppliers?.filter((supplier: any) => {
    return supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           supplier.phone?.includes(searchTerm);
  });

  const getSupplierProductCount = (supplierId: number) => {
    return products?.filter((product: any) => product.supplierId === supplierId).length || 0;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fornecedores</h1>
            <p className="text-muted-foreground">Gerencie seus fornecedores</p>
          </div>
          
          <Dialog 
            open={isAddDialogOpen} 
            onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                setEditingSupplier(null);
                form.reset();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? "Editar Fornecedor" : "Adicionar Fornecedor"}
                </DialogTitle>
                <DialogDescription>
                  {editingSupplier ? "Modifique as informações do fornecedor selecionado." : "Preencha os campos abaixo para adicionar um novo fornecedor."}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do fornecedor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="fornecedor@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Endereço completo do fornecedor" {...field} />
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
                      disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                    >
                      {editingSupplier ? "Atualizar" : "Adicionar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Suppliers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Lista de Fornecedores ({filteredSuppliers?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {suppliersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-muted rounded" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead className="text-center">Produtos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers?.map((supplier: any) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Truck className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Cadastrado em {new Date(supplier.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {supplier.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                              {supplier.phone}
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                              {supplier.email}
                            </div>
                          )}
                          {!supplier.phone && !supplier.email && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.address ? (
                          <div className="flex items-start text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{supplier.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {getSupplierProductCount(supplier.id)} produtos
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(supplier.id)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
