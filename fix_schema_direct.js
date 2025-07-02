import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSchemaDirect() {
  try {
    console.log('🔧 Executando correções no schema do Supabase...\n');
    
    // 1. Adicionar campo CNPJ na tabela companies
    console.log('📝 Adicionando campo CNPJ na tabela companies...');
    
    const { data: alterResult, error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'companies' AND column_name = 'cnpj'
          ) THEN
            ALTER TABLE companies ADD COLUMN cnpj TEXT;
            RAISE NOTICE 'Campo CNPJ adicionado com sucesso';
          ELSE
            RAISE NOTICE 'Campo CNPJ já existe';
          END IF;
        END $$;
      `
    });
    
    if (alterError) {
      console.log('⚠️  Tentando abordagem alternativa para adicionar CNPJ...');
      
      // Tentar via SQL direto
      const { error: directError } = await supabase.rpc('sql', {
        query: 'ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnpj TEXT;'
      });
      
      if (directError) {
        console.log('❌ Não foi possível adicionar CNPJ via RPC:', directError.message);
        console.log('💡 Será necessário fazer manualmente via Dashboard');
      } else {
        console.log('✅ Campo CNPJ adicionado via SQL direto');
      }
    } else {
      console.log('✅ Campo CNPJ processado com sucesso');
    }

    // 2. Habilitar RLS em todas as tabelas
    console.log('\n🔒 Habilitando RLS em todas as tabelas...');
    
    const tables = [
      'companies',
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
      console.log(`🔐 Habilitando RLS para: ${table}`);
      
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
      });
      
      if (rlsError) {
        // Tentar abordagem alternativa
        const { error: directRlsError } = await supabase.rpc('sql', {
          query: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
        });
        
        if (directRlsError) {
          console.log(`❌ Erro ao habilitar RLS para ${table}:`, directRlsError.message);
        } else {
          console.log(`✅ RLS habilitado para ${table}`);
        }
      } else {
        console.log(`✅ RLS habilitado para ${table}`);
      }
    }

    // 3. Verificar resultado final
    console.log('\n📊 Verificando resultados...');
    
    // Testar se CNPJ foi adicionado
    const { data: cnpjTest, error: cnpjError } = await supabase
      .from('companies')
      .select('id, name, cnpj')
      .limit(1);
    
    if (cnpjError) {
      console.log('❌ Campo CNPJ ainda não disponível:', cnpjError.message);
    } else {
      console.log('✅ Campo CNPJ funcionando corretamente');
      if (cnpjTest.length > 0) {
        console.log('📋 Exemplo:', cnpjTest[0]);
      }
    }

    // Verificar RLS status via query direta
    console.log('\n🔍 Verificando status RLS...');
    
    const { data: rlsStatus, error: rlsStatusError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = ANY(ARRAY['companies', 'users', 'suppliers', 'categories', 'products'])
        ORDER BY tablename;
      `
    });
    
    if (rlsStatusError) {
      console.log('❌ Erro ao verificar RLS:', rlsStatusError.message);
    } else {
      console.log('📈 Status RLS atual:');
      if (rlsStatus && rlsStatus.length > 0) {
        rlsStatus.forEach(row => {
          const status = row.rowsecurity ? '✅ HABILITADO' : '❌ DESABILITADO';
          console.log(`  ${row.tablename}: ${status}`);
        });
      } else {
        console.log('  Dados não disponíveis via RPC');
      }
    }

    console.log('\n🎯 Correções finalizadas!');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  }
}

fixSchemaDirect();