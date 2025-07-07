
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProperRLSPolicies() {
  try {
    console.log('🔐 CRIANDO POLÍTICAS RLS PARA MULTI-TENANCY PERFEITO...\n');
    
    // 1. Remover políticas antigas se existirem
    console.log('1️⃣ Removendo políticas antigas...');
    
    const tables = ['companies', 'users', 'products', 'suppliers', 'categories', 'stock_movements', 'checklist_templates', 'checklist_items', 'checklist_executions', 'checklist_execution_items'];
    
    for (const table of tables) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "Enable read/write for authenticated users on ${table}" ON ${table};`
      });
      
      const { error: error2 } = await supabase.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${table}_policy" ON ${table};`
      });
    }
    
    console.log('✅ Políticas antigas removidas');
    
    // 2. Criar políticas específicas para multi-tenancy
    console.log('\n2️⃣ Criando políticas multi-tenancy...');
    
    const policies = [
      {
        table: 'companies',
        policy: `
          CREATE POLICY "multi_tenant_companies" ON companies
          FOR ALL USING (
            -- MASTER users see all companies
            EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
            OR
            -- Users see their own company
            id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
          );
        `
      },
      {
        table: 'users', 
        policy: `
          CREATE POLICY "multi_tenant_users" ON users
          FOR ALL USING (
            -- MASTER users see all users
            EXISTS (SELECT 1 FROM users AS master WHERE master.supabase_user_id = auth.uid()::text AND master.role = 'MASTER')
            OR
            -- Users see themselves
            supabase_user_id = auth.uid()::text
            OR
            -- Admins see users from same company
            (company_id IN (
              SELECT company_id FROM users AS admin 
              WHERE admin.supabase_user_id = auth.uid()::text 
              AND admin.role IN ('admin', 'gerente')
            ))
          );
        `
      },
      {
        table: 'products',
        policy: `
          CREATE POLICY "multi_tenant_products" ON products
          FOR ALL USING (
            -- MASTER users see all products
            EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
            OR
            -- Users see products from their company
            company_id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
          );
        `
      },
      {
        table: 'suppliers',
        policy: `
          CREATE POLICY "multi_tenant_suppliers" ON suppliers
          FOR ALL USING (
            -- MASTER users see all suppliers
            EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
            OR
            -- Users see suppliers from their company
            company_id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
          );
        `
      },
      {
        table: 'categories',
        policy: `
          CREATE POLICY "multi_tenant_categories" ON categories
          FOR ALL USING (
            -- MASTER users see all categories
            EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
            OR
            -- Users see categories from their company
            company_id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
          );
        `
      },
      {
        table: 'stock_movements',
        policy: `
          CREATE POLICY "multi_tenant_stock_movements" ON stock_movements
          FOR ALL USING (
            -- MASTER users see all movements
            EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
            OR
            -- Users see movements from their company
            company_id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
          );
        `
      },
      {
        table: 'checklist_templates',
        policy: `
          CREATE POLICY "multi_tenant_checklist_templates" ON checklist_templates
          FOR ALL USING (
            -- MASTER users see all templates
            EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
            OR
            -- Users see templates from their company
            company_id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
          );
        `
      },
      {
        table: 'checklist_items',
        policy: `
          CREATE POLICY "multi_tenant_checklist_items" ON checklist_items
          FOR ALL USING (
            -- MASTER users see all items
            EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
            OR
            -- Users see items from templates of their company
            template_id IN (
              SELECT id FROM checklist_templates 
              WHERE company_id IN (
                SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text
              )
            )
          );
        `
      },
      {
        table: 'checklist_executions',
        policy: `
          CREATE POLICY "multi_tenant_checklist_executions" ON checklist_executions
          FOR ALL USING (
            -- MASTER users see all executions
            EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
            OR
            -- Users see executions from their company
            company_id IN (SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text)
          );
        `
      },
      {
        table: 'checklist_execution_items',
        policy: `
          CREATE POLICY "multi_tenant_checklist_execution_items" ON checklist_execution_items
          FOR ALL USING (
            -- MASTER users see all execution items
            EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid()::text AND role = 'MASTER')
            OR
            -- Users see execution items from their company executions
            execution_id IN (
              SELECT id FROM checklist_executions 
              WHERE company_id IN (
                SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text
              )
            )
          );
        `
      }
    ];
    
    // Aplicar cada política
    for (const { table, policy } of policies) {
      console.log(`🔒 Criando política para ${table}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      
      if (error) {
        console.error(`❌ Erro ao criar política para ${table}:`, error.message);
      } else {
        console.log(`✅ Política criada para ${table}`);
      }
    }
    
    // 3. Verificar políticas criadas
    console.log('\n3️⃣ Verificando políticas criadas...');
    
    const { data: policiesCheck, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname LIKE 'multi_tenant_%'
        ORDER BY tablename;
      `
    });
    
    if (checkError) {
      console.error('❌ Erro ao verificar políticas:', checkError);
    } else {
      console.log(`✅ ${policiesCheck.length} políticas multi-tenancy criadas:`);
      policiesCheck.forEach(p => {
        console.log(`   ${p.tablename} → ${p.policyname}`);
      });
    }
    
    console.log('\n🎯 POLÍTICAS RLS MULTI-TENANCY CRIADAS COM SUCESSO!');
    console.log('🔐 Sistema agora tem isolamento perfeito entre empresas');
    console.log('👑 Usuários MASTER podem ver dados de todas as empresas');
    console.log('🏢 Usuários normais só veem dados da própria empresa');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

createProperRLSPolicies();
