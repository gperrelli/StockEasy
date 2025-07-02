import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyState() {
  try {
    console.log('🔍 Verificando estado atual do banco Supabase...\n');
    
    // 1. Verificar estrutura da tabela companies
    console.log('📋 Estrutura da tabela companies:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (companiesError) {
      console.log('❌ Erro ao acessar companies:', companiesError.message);
    } else {
      if (companies.length > 0) {
        const columns = Object.keys(companies[0]);
        console.log('✅ Colunas disponíveis:', columns);
        
        if (columns.includes('cnpj')) {
          console.log('✅ Campo CNPJ: EXISTE');
        } else {
          console.log('❌ Campo CNPJ: NÃO EXISTE');
        }
      } else {
        console.log('⚠️  Tabela companies vazia');
      }
    }

    // 2. Tentar verificar RLS indiretamente
    console.log('\n🔒 Verificando acesso às tabelas (indicativo de RLS):');
    
    const tables = ['companies', 'users', 'suppliers', 'categories', 'products'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('RLS')) {
          console.log(`🔒 ${table}: RLS provavelmente HABILITADO (${error.message})`);
        } else {
          console.log(`❌ ${table}: ERRO - ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: ACESSÍVEL (${data.length} registros)`);
      }
    }

    // 3. Verificar dados existentes
    console.log('\n📊 Resumo dos dados:');
    
    const { data: allCompanies } = await supabase
      .from('companies')
      .select('id, name, email');
    
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, name, email, role');
    
    console.log(`💼 Empresas: ${allCompanies?.length || 0}`);
    console.log(`👥 Usuários: ${allUsers?.length || 0}`);
    
    if (allCompanies?.length > 0) {
      console.log('🏢 Empresas registradas:');
      allCompanies.forEach(company => {
        console.log(`  • ${company.name} (ID: ${company.id})`);
      });
    }

    console.log('\n🎯 PRÓXIMOS PASSOS NECESSÁRIOS:');
    
    const { data: testCnpj, error: cnpjError } = await supabase
      .from('companies')
      .select('cnpj')
      .limit(1);
    
    if (cnpjError && cnpjError.message.includes('does not exist')) {
      console.log('1. ❌ Adicionar campo CNPJ na tabela companies');
      console.log('   - Acesse Supabase Dashboard > Table Editor > companies');
      console.log('   - Add Column: nome="cnpj", tipo="text", nullable=true');
    } else {
      console.log('1. ✅ Campo CNPJ já existe');
    }
    
    console.log('2. 🔒 Habilitar RLS em todas as tabelas');
    console.log('   - Acesse Supabase Dashboard > Authentication > RLS');
    console.log('   - Habilite RLS para todas as tabelas do sistema');

  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  }
}

verifyState();