
-- 🔐 POLÍTICAS RLS FINAIS PARA MULTI-TENANCY
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Limpar políticas antigas
DROP POLICY IF EXISTS "multi_tenant_companies" ON companies;
DROP POLICY IF EXISTS "multi_tenant_users" ON users;
DROP POLICY IF EXISTS "multi_tenant_products" ON products;
DROP POLICY IF EXISTS "multi_tenant_suppliers" ON suppliers;
DROP POLICY IF EXISTS "multi_tenant_categories" ON categories;
DROP POLICY IF EXISTS "multi_tenant_stock_movements" ON stock_movements;
DROP POLICY IF EXISTS "multi_tenant_checklist_templates" ON checklist_templates;
DROP POLICY IF EXISTS "multi_tenant_checklist_items" ON checklist_items;
DROP POLICY IF EXISTS "multi_tenant_checklist_executions" ON checklist_executions;
DROP POLICY IF EXISTS "multi_tenant_checklist_execution_items" ON checklist_execution_items;

-- 2. Garantir que RLS está habilitado
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_execution_items ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas multi-tenancy

-- Companies: MASTER vê todas, usuários veem só sua empresa
CREATE POLICY "multi_tenant_companies" ON companies
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
  OR
  id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
);

-- Users: MASTER vê todos, usuários veem colegas da empresa
CREATE POLICY "multi_tenant_users" ON users
FOR ALL USING (
  EXISTS (SELECT 1 FROM users AS master WHERE master.supabase_user_id = auth.uid()::text AND master.role = 'MASTER')
  OR
  supabase_user_id = auth.uid()::text
  OR
  company_id IN (
    SELECT company_id FROM users AS admin 
    WHERE admin.supabase_user_id = auth.uid()::text 
    AND admin.role IN ('admin', 'gerente')
  )
);

-- Products: Isolamento por empresa
CREATE POLICY "multi_tenant_products" ON products
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
  OR
  company_id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
);

-- Suppliers: Isolamento por empresa
CREATE POLICY "multi_tenant_suppliers" ON suppliers
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
  OR
  company_id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
);

-- Categories: Isolamento por empresa
CREATE POLICY "multi_tenant_categories" ON categories
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
  OR
  company_id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
);

-- Stock Movements: Isolamento por empresa
CREATE POLICY "multi_tenant_stock_movements" ON stock_movements
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
  OR
  company_id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
);

-- Checklist Templates: Isolamento por empresa
CREATE POLICY "multi_tenant_checklist_templates" ON checklist_templates
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
  OR
  company_id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
);

-- Checklist Items: Baseado no template da empresa
CREATE POLICY "multi_tenant_checklist_items" ON checklist_items
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
  OR
  template_id IN (
    SELECT id FROM checklist_templates 
    WHERE company_id IN (
      SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text
    )
  )
);

-- Checklist Executions: Isolamento por empresa
CREATE POLICY "multi_tenant_checklist_executions" ON checklist_executions
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
  OR
  company_id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
);

-- Checklist Execution Items: Baseado na execução da empresa
CREATE POLICY "multi_tenant_checklist_execution_items" ON checklist_execution_items
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
  OR
  execution_id IN (
    SELECT id FROM checklist_executions 
    WHERE company_id IN (
      SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text
    )
  )
);

-- 4. Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE 'multi_tenant_%'
ORDER BY tablename, policyname;
