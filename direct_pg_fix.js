import pg from 'postgres';

const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;

if (!supabaseDbUrl) {
  console.error('❌ SUPABASE_DATABASE_URL não encontrada');
  process.exit(1);
}

const sql = pg(supabaseDbUrl);

async function directPgFix() {
  try {
    console.log('🔧 Conectando diretamente ao PostgreSQL do Supabase...\n');
    
    // 1. Adicionar campo CNPJ
    console.log('📝 Adicionando campo CNPJ na tabela companies...');
    
    await sql`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS cnpj TEXT;
    `;
    
    console.log('✅ Campo CNPJ adicionado com sucesso');

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
      try {
        console.log(`🔐 Habilitando RLS para: ${table}`);
        
        await sql`
          ALTER TABLE ${sql(table)} ENABLE ROW LEVEL SECURITY;
        `;
        
        console.log(`✅ RLS habilitado para ${table}`);
      } catch (error) {
        if (error.message.includes('already enabled')) {
          console.log(`✅ RLS já habilitado para ${table}`);
        } else {
          console.log(`❌ Erro ao habilitar RLS para ${table}:`, error.message);
        }
      }
    }

    // 3. Verificar resultado
    console.log('\n📊 Verificando resultados...');
    
    // Testar CNPJ
    const companies = await sql`
      SELECT id, name, email, cnpj 
      FROM companies 
      LIMIT 1;
    `;
    
    if (companies.length > 0) {
      console.log('✅ Campo CNPJ funcionando:', Object.keys(companies[0]));
      console.log('📋 Dados de exemplo:', companies[0]);
    }

    // Verificar RLS status
    console.log('\n🔍 Verificando status RLS...');
    
    const rlsStatus = await sql`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = ANY(${tables})
      ORDER BY tablename;
    `;
    
    console.log('📈 Status RLS:');
    rlsStatus.forEach(row => {
      const status = row.rowsecurity ? '✅ HABILITADO' : '❌ DESABILITADO';
      console.log(`  ${row.tablename}: ${status}`);
    });

    console.log('\n🎯 Correções aplicadas com sucesso!');
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    await sql.end();
  }
}

directPgFix();