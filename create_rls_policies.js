import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRLSPolicies() {
  try {
    console.log('🔐 Criando políticas RLS para multi-tenancy...\n');
    
    // Políticas RLS básicas para cada tabela
    const policies = [
      {
        table: 'companies',
        name: 'companies_policy',
        sql: `
          CREATE POLICY companies_policy ON companies 
          FOR ALL USING (
            auth.uid() IN (
              SELECT supabase_user_id::uuid FROM users 
              WHERE role = 'MASTER' OR company_id = companies.id
            )
          );
        `
      },
      {
        table: 'users',
        name: 'users_policy',
        sql: `
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
        `
      },
      {
        table: 'products',
        name: 'products_policy',
        sql: `
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
        `
      },
      {
        table: 'suppliers',
        name: 'suppliers_policy',
        sql: `
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
        `
      },
      {
        table: 'categories',
        name: 'categories_policy',
        sql: `
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
        `
      },
      {
        table: 'stock_movements',
        name: 'stock_movements_policy',
        sql: `
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
        `
      },
      {
        table: 'checklist_templates',
        name: 'checklist_templates_policy',
        sql: `
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
        `
      }
    ];

    console.log('🗑️ Primeiro, removendo políticas existentes...');
    
    for (const policy of policies) {
      console.log(`Removendo política existente para ${policy.table}...`);
      
      try {
        const { error: dropError } = await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS ${policy.name} ON ${policy.table};`
        });
        
        if (dropError && !dropError.message.includes('does not exist')) {
          console.log(`⚠️ Aviso ao remover política ${policy.name}:`, dropError.message);
        }
      } catch (e) {
        // Política pode não existir, continuar
      }
    }

    console.log('\n🔨 Criando novas políticas RLS...');
    
    for (const policy of policies) {
      console.log(`📝 Criando política para ${policy.table}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: policy.sql
      });
      
      if (error) {
        console.log(`❌ Erro ao criar política para ${policy.table}:`, error.message);
        
        // Tentar abordagem alternativa sem RPC
        console.log(`🔄 Tentando método alternativo para ${policy.table}...`);
        
        // Instruções manuais como fallback
        console.log(`\n📋 POLÍTICA MANUAL PARA ${policy.table.toUpperCase()}:`);
        console.log(policy.sql);
        console.log('---');
        
      } else {
        console.log(`✅ Política criada para ${policy.table}`);
      }
    }

    // Testar novamente
    console.log('\n🧪 Testando RLS após criação das políticas...');
    
    const publicSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: testData, error: testError } = await publicSupabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('✅ RLS funcionando! Erro esperado:', testError.message);
    } else {
      console.log('❌ RLS ainda não funcionando - dados acessíveis publicamente');
      console.log('💡 Políticas precisam ser criadas manualmente no SQL Editor');
    }

  } catch (error) {
    console.error('💥 Erro ao criar políticas RLS:', error.message);
  }
}

createRLSPolicies();