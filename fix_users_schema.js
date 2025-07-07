
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUsersSchema() {
  try {
    console.log('🔧 CORRIGINDO SCHEMA DA TABELA USERS...\n');
    
    // 1. Verificar se coluna is_active existe
    console.log('1️⃣ Verificando estrutura atual...');
    
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }
    
    console.log('📋 Colunas atuais da tabela users:');
    columns.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // 2. Verificar se is_active existe
    const hasIsActive = columns.some(col => col.column_name === 'is_active');
    
    if (!hasIsActive) {
      console.log('\n2️⃣ Adicionando coluna is_active...');
      
      const { error: addColumnError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE users 
          ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
        `
      });
      
      if (addColumnError) {
        console.error('❌ Erro ao adicionar coluna:', addColumnError);
        return;
      }
      
      console.log('✅ Coluna is_active adicionada com sucesso!');
    } else {
      console.log('✅ Coluna is_active já existe!');
    }
    
    // 3. Testar criação de usuário
    console.log('\n3️⃣ Testando criação de usuário...');
    
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .insert({
        name: 'Usuário Teste',
        email: `teste-${Date.now()}@exemplo.com`,
        role: 'operador',
        company_id: 1,
        is_active: true
      })
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Erro ao criar usuário teste:', testError);
    } else {
      console.log('✅ Usuário teste criado com sucesso!', testUser.name);
      
      // Limpar teste
      await supabase.from('users').delete().eq('id', testUser.id);
      console.log('🧹 Usuário teste removido');
    }
    
    console.log('\n🎯 SCHEMA CORRIGIDO COM SUCESSO!');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

fixUsersSchema();
