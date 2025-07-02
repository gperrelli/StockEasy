import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function enableRLS() {
  try {
    console.log('🔒 Habilitando RLS em todas as tabelas...\n');
    
    const tables = [
      'companies',
      'super_admins', 
      'users',
      'suppliers',
      'categories',
      'products',
      'stock_movements',
      'checklist_templates',
      'checklist_items',
      'checklist_executions',
      'checklist_execution_items'
    ];

    for (const table of tables) {
      console.log(`🔐 Habilitando RLS para tabela: ${table}`);
      
      const { error } = await supabase.rpc('enable_rls', {
        table_name: table
      });
      
      if (error) {
        console.error(`❌ Erro ao habilitar RLS para ${table}:`, error);
        
        // Tentar abordagem alternativa via SQL direto
        try {
          const { error: sqlError } = await supabase
            .from('_dummy_table_for_sql_execution')
            .select('1')
            .limit(0);
          
          // Se chegou até aqui, o Supabase aceita queries SQL diretas
          console.log(`⚡ Tentando SQL direto para ${table}...`);
        } catch (e) {
          console.log(`⚠️  Supabase não permite SQL direto para ${table}, continuando...`);
        }
      } else {
        console.log(`✅ RLS habilitado para ${table}`);
      }
    }

    console.log('\n🎯 Verificando status do RLS...');
    
    const { data: rlsStatus, error: statusError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (${tables.map(t => `'${t}'`).join(', ')})
        ORDER BY tablename;
      `
    });

    if (statusError) {
      console.error('❌ Erro ao verificar status RLS:', statusError);
      return;
    }

    console.log('\n📊 Status final do RLS:');
    rlsStatus.forEach(table => {
      const status = table.rowsecurity ? '✅ HABILITADO' : '❌ DESABILITADO';
      console.log(`  ${table.tablename}: ${status}`);
    });

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

enableRLS();