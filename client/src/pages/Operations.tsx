import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Users, BarChart3, Settings, FileText, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function Operations() {
  const operationCards = [
    {
      title: "Checklist Diário",
      description: "Gerencie as rotinas de abertura, fechamento e limpeza",
      icon: <ClipboardCheck className="h-8 w-8" />,
      link: "/checklist",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
    },
    {
      title: "Gestão de Usuários",
      description: "Controle os usuários e suas permissões",
      icon: <Users className="h-8 w-8" />,
      link: "/cadastros/usuarios",
      color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
    },
    {
      title: "Relatórios",
      description: "Visualize relatórios de estoque e movimentações",
      icon: <BarChart3 className="h-8 w-8" />,
      link: "/reports",
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
    },
    {
      title: "Configurações",
      description: "Configure parâmetros do sistema",
      icon: <Settings className="h-8 w-8" />,
      link: "#",
      color: "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300"
    },
    {
      title: "Logs do Sistema",
      description: "Visualize logs e auditoria do sistema",
      icon: <FileText className="h-8 w-8" />,
      link: "#",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
    },
    {
      title: "Agendamentos",
      description: "Gerencie tarefas e eventos programados",
      icon: <Calendar className="h-8 w-8" />,
      link: "#",
      color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Operações</h1>
        <p className="text-muted-foreground">Central de operações e configurações do sistema</p>
      </div>

      {/* Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operationCards.map((card, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                {card.icon}
              </div>
              <CardTitle className="text-lg">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                {card.description}
              </p>
              {card.link !== "#" ? (
                <Link href={card.link}>
                  <Button variant="outline" className="w-full">
                    Acessar
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Em breve
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Checklists Hoje</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tarefas Pendentes</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sistema</p>
                <p className="text-lg font-bold text-green-600">Online</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}