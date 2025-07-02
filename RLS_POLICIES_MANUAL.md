# 🔐 POLÍTICAS RLS PARA MULTI-TENANCY

## ❌ PROBLEMA IDENTIFICADO
O RLS foi habilitado nas tabelas, mas **as políticas de segurança não foram criadas**. Isso significa que as tabelas estão bloqueadas mas sem regras de acesso.

## 🎯 SOLUÇÃO: CRIAR POLÍTICAS MANUALMENTE

### 1. ACESSE SQL EDITOR NO SUPABASE
- Dashboard → SQL Editor
- Cole e execute cada política abaixo **UMA POR VEZ**

### 2. POLÍTICAS PARA CADA TABELA

```sql
-- POLÍTICA PARA COMPANIES
CREATE POLICY companies_policy ON companies 
FOR ALL USING (
  auth.uid() IN (
    SELECT supabase_user_id::uuid FROM users 
    WHERE role = 'MASTER' OR company_id = companies.id
  )
);

-- POLÍTICA PARA USERS  
CREATE POLICY users_policy ON users 
FOR ALL USING (
  auth.uid() IN (
    SELECT supabase_user_id::uuid FROM users AS master_users 
    WHERE master_users.role = 'MASTER'
  ) OR
  auth.uid()::text = supabase_user_id OR
  company_id IN (
    SELECT company_id FROM users AS user_company 
    WHERE user_company.supabase_user_id = auth.uid()::text 
    AND user_company.role IN ('admin', 'gerente')
  )
);

-- POLÍTICA PARA PRODUCTS
CREATE POLICY products_policy ON products 
FOR ALL USING (
  company_id IN (
    SELECT company_id FROM users 
    WHERE supabase_user_id = auth.uid()::text
  ) OR
  auth.uid() IN (
    SELECT supabase_user_id::uuid FROM users 
    WHERE role = 'MASTER'
  )
);

-- POLÍTICA PARA SUPPLIERS
CREATE POLICY suppliers_policy ON suppliers 
FOR ALL USING (
  company_id IN (
    SELECT company_id FROM users 
    WHERE supabase_user_id = auth.uid()::text
  ) OR
  auth.uid() IN (
    SELECT supabase_user_id::uuid FROM users 
    WHERE role = 'MASTER'
  )
);

-- POLÍTICA PARA CATEGORIES
CREATE POLICY categories_policy ON categories 
FOR ALL USING (
  company_id IN (
    SELECT company_id FROM users 
    WHERE supabase_user_id = auth.uid()::text
  ) OR
  auth.uid() IN (
    SELECT supabase_user_id::uuid FROM users 
    WHERE role = 'MASTER'
  )
);

-- POLÍTICA PARA STOCK_MOVEMENTS
CREATE POLICY stock_movements_policy ON stock_movements 
FOR ALL USING (
  company_id IN (
    SELECT company_id FROM users 
    WHERE supabase_user_id = auth.uid()::text
  ) OR
  auth.uid() IN (
    SELECT supabase_user_id::uuid FROM users 
    WHERE role = 'MASTER'
  )
);

-- POLÍTICA PARA CHECKLIST_TEMPLATES
CREATE POLICY checklist_templates_policy ON checklist_templates 
FOR ALL USING (
  company_id IN (
    SELECT company_id FROM users 
    WHERE supabase_user_id = auth.uid()::text
  ) OR
  auth.uid() IN (
    SELECT supabase_user_id::uuid FROM users 
    WHERE role = 'MASTER'
  )
);

-- POLÍTICA PARA CHECKLIST_ITEMS
CREATE POLICY checklist_items_policy ON checklist_items 
FOR ALL USING (
  template_id IN (
    SELECT id FROM checklist_templates 
    WHERE company_id IN (
      SELECT company_id FROM users 
      WHERE supabase_user_id = auth.uid()::text
    )
  ) OR
  auth.uid() IN (
    SELECT supabase_user_id::uuid FROM users 
    WHERE role = 'MASTER'
  )
);

-- POLÍTICA PARA CHECKLIST_EXECUTIONS
CREATE POLICY checklist_executions_policy ON checklist_executions 
FOR ALL USING (
  company_id IN (
    SELECT company_id FROM users 
    WHERE supabase_user_id = auth.uid()::text
  ) OR
  auth.uid() IN (
    SELECT supabase_user_id::uuid FROM users 
    WHERE role = 'MASTER'
  )
);

-- POLÍTICA PARA CHECKLIST_EXECUTION_ITEMS
CREATE POLICY checklist_execution_items_policy ON checklist_execution_items 
FOR ALL USING (
  execution_id IN (
    SELECT id FROM checklist_executions 
    WHERE company_id IN (
      SELECT company_id FROM users 
      WHERE supabase_user_id = auth.uid()::text
    )
  ) OR
  auth.uid() IN (
    SELECT supabase_user_id::uuid FROM users 
    WHERE role = 'MASTER'
  )
);
```

### 3. VERIFICAR SE FUNCIONOU

Após criar todas as políticas, execute no SQL Editor:

```sql
-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 4. LÓGICA DAS POLÍTICAS

**Multi-Tenancy**: Usuários só veem dados da própria empresa  
**MASTER Role**: Usuário MASTER vê dados de todas as empresas  
**Hierarquia**: Admins/gerentes podem ver dados dos usuários da empresa  
**Isolamento**: Dados completamente isolados entre empresas diferentes

## ✅ RESULTADO ESPERADO
Após criar as políticas, o sistema terá multi-tenancy completo e seguro.