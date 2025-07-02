import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addCnpjAndEnableRLS() {
  try {
    console.log('🔧 Verificando campo CNPJ na tabela companies...\n');
    
    // 1. Verificar se CNPJ já existe na tabela companies
    const { data: companies, error: selectError } = await supabase
      .from('companies')
      .select('id, name, email, cnpj')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Erro ao verificar tabela companies:', selectError);
      
      // Se deu erro, provavelmente o campo CNPJ não existe, vamos adicioná-lo
      console.log('🔨 Tentando adicionar campo CNPJ...');
      
      // Como não podemos executar ALTER TABLE diretamente pelo client JS,
      // vamos instruir o usuário a fazer isso manualmente no Supabase
      console.log('\n⚠️  INSTRUÇÕES PARA ADICIONAR CNPJ:');
      console.log('1. Acesse o Supabase Dashboard');
      console.log('2. Vá para Table Editor > companies');
      console.log('3. Clique em "Add Column"');
      console.log('4. Nome: cnpj, Tipo: text, Nullable: true');
      console.log('5. Salve a alteração');
      
    } else {
      console.log('✅ Campo CNPJ já existe na tabela companies');
      if (companies.length > 0) {
        console.log('Exemplo de dados:', companies[0]);
      }
    }

    console.log('\n🔒 INSTRUÇÕES PARA HABILITAR RLS:');
    console.log('Como o cliente JavaScript não permite executar ALTER TABLE diretamente,');
    console.log('você precisa habilitar RLS manualmente no Supabase Dashboard:');
    console.log('');
    console.log('1. Acesse: Supabase Dashboard > Authentication > RLS');
    console.log('2. Para cada tabela abaixo, clique em "Enable RLS":');
    
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
    
    tables.forEach(table => {
      console.log(`   - ${table}`);
    });
    
    console.log('\n3. Ou execute este SQL no SQL Editor:');
    console.log('');
    tables.forEach(table => {
      console.log(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    });
    
    console.log('\n📋 Verificando status atual das tabelas...');
    
    // Verificar se conseguimos acessar as tabelas (indicação de RLS status)
    const tableStatus = [];
    
    for (const table of tables.slice(0, 3)) { // Verificar apenas algumas tabelas
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          tableStatus.push({ table, status: 'ERRO', error: error.message });
        } else {
          tableStatus.push({ table, status: 'ACESSÍVEL', records: data?.length || 0 });
        }
      } catch (e) {
        tableStatus.push({ table, status: 'ERRO', error: e.message });
      }
    }
    
    console.log('\n📊 Status de acesso às tabelas:');
    tableStatus.forEach(({ table, status, records, error }) => {
      if (status === 'ACESSÍVEL') {
        console.log(`✅ ${table}: ${status} (${records} registros)`);
      } else {
        console.log(`❌ ${table}: ${status} - ${error}`);
      }
    });

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

addCnpjAndEnableRLS();