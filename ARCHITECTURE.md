# StockEasy - Multi-Tenant SaaS Architecture

## Fluxo de Autenticação Multi-Tenant

### 1. Níveis de Usuários

#### Super Admin (Nível Global)
- Gerencia múltiplas empresas
- Cria empresas e seus admins
- Acesso total ao sistema
- **Não pertence a nenhuma empresa específica**

#### Admin da Empresa (Nível Empresa)
- Gerencia usuários da sua empresa
- Configura dados da empresa
- Acesso total aos dados da empresa
- **Pertence a uma empresa específica**

#### Usuários da Empresa (Nível Operacional)
- Roles: gerente, operador
- Acesso limitado aos dados da empresa
- **Pertence a uma empresa específica**

### 2. Fluxo de Cadastro Atual (PROBLEMA)

```
❌ ATUAL (Confuso):
1. Admin cria usuário no frontend → Salva no banco local
2. Usuário não existe no Supabase Auth
3. Usuário não consegue fazer login
```

### 3. Fluxo de Cadastro Correto (SOLUÇÃO)

```
✅ CORRETO:
1. Super Admin cria empresa + admin da empresa
2. Admin da empresa convida usuários (por email)
3. Usuários recebem convite e criam conta no Supabase
4. Sistema sincroniza automaticamente com banco local
```

### 4. Implementação Necessária

#### A. Endpoint de Convite de Usuários
- Admin envia convite por email
- Link especial para cadastro com role pré-definida
- Usuário cria conta no Supabase através do link

#### B. Sincronização Automática
- Quando usuário completa cadastro no Supabase
- Sistema cria registro no banco local automaticamente
- Associa à empresa correta via token do convite

#### C. Controle de Acesso
- Row Level Security (RLS) no Supabase
- Usuários só veem dados da sua empresa
- Super admins veem todas as empresas

## Status Atual

- ✅ Autenticação Supabase funcionando
- ✅ Sincronização manual funcionando  
- ❌ Sistema de convites não implementado
- ❌ RLS não configurado
- ❌ Separação clara de níveis não implementada

## Próximos Passos

1. Implementar sistema de convites
2. Configurar RLS no Supabase
3. Separar interface Super Admin vs Admin Empresa
4. Migrar cadastro manual para sistema de convites