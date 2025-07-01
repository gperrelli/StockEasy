import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  AlertTriangle, 
  ArrowUpDown, 
  Truck,
  Plus,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  History,
  ClipboardCheck
} from "lucide-react";
export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery({
    queryKey: ["/api/products/low-stock"],
  });

  const { data: recentMovements, isLoading: movementsLoading } = useQuery({
    queryKey: ["/api/movements", { limit: 5 }],
  });

  if (statsLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                <p className="text-3xl font-bold">{stats?.totalProducts || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Package className="text-primary h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="text-green-600 h-4 w-4 mr-1" />
              <span className="text-sm text-green-600">+12 este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estoque Baixo</p>
                <p className="text-3xl font-bold text-destructive">{stats?.lowStockCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-destructive h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-destructive">Atenção necessária</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Movimentações Hoje</p>
                <p className="text-3xl font-bold">{stats?.todayMovements || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <ArrowUpDown className="text-green-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="text-green-600 h-4 w-4 mr-1" />
              <span className="text-sm text-green-600">+3 desde ontem</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fornecedores</p>
                <p className="text-3xl font-bold">{stats?.suppliersCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <Truck className="text-yellow-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">Ativos no sistema</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="text-destructive mr-2 h-5 w-5" />
              Produtos com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-muted rounded" />
                ))}
              </div>
            ) : lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category?.name || "Sem categoria"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-destructive">
                        {product.currentStock} {product.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Mín: {product.minStock}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4">
                  Ver Todos os Produtos
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum produto com estoque baixo</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="text-muted-foreground mr-2 h-5 w-5" />
              Movimentações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {movementsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-muted rounded" />
                ))}
              </div>
            ) : recentMovements && recentMovements.length > 0 ? (
              <div className="space-y-3">
                {recentMovements.map((movement: any) => (
                  <div key={movement.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        movement.type === 'entrada' 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : 'bg-red-100 dark:bg-red-900'
                      }`}>
                        {movement.type === 'entrada' ? (
                          <TrendingUp className="text-green-600 h-4 w-4" />
                        ) : (
                          <TrendingDown className="text-red-600 h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {movement.type === 'entrada' ? 'Entrada' : 'Saída'} - {movement.product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(movement.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${
                      movement.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.type === 'entrada' ? '+' : '-'}{movement.quantity} {movement.product.unit}
                    </span>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4">
                  Ver Histórico Completo
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma movimentação recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-24 flex-col space-y-2 border-dashed">
              <Plus className="h-6 w-6" />
              <span>Adicionar Produto</span>
            </Button>
            
            <Button variant="outline" className="h-24 flex-col space-y-2 border-dashed">
              <ArrowUpDown className="h-6 w-6" />
              <span>Registrar Movimentação</span>
            </Button>
            
            <Button variant="outline" className="h-24 flex-col space-y-2 border-dashed">
              <ClipboardCheck className="h-6 w-6" />
              <span>Abrir Checklist</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Purchase Planner */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="text-muted-foreground mr-2 h-5 w-5" />
            Planejamento Semanal de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, index) => (
              <div key={day} className="border border-border rounded-lg p-4">
                <h4 className="font-medium mb-3">{day}</h4>
                <div className="space-y-2">
                  {index === 0 && (
                    <>
                      <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        Verduras (3 itens)
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300">
                        Laticínios (2 itens)
                      </Badge>
                    </>
                  )}
                  {index === 1 && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                      Carnes (4 itens)
                    </Badge>
                  )}
                  {index === 3 && (
                    <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                      Bebidas (5 itens)
                    </Badge>
                  )}
                  {index === 4 && (
                    <>
                      <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300">
                        Massas (2 itens)
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                        Temperos (3 itens)
                      </Badge>
                    </>
                  )}
                  {(index === 2 || index === 5 || index === 6) && (
                    <div className="text-sm text-muted-foreground">Nenhuma compra</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
