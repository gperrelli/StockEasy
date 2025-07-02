import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function directSupabaseFix() {
  try {
    console.log('🔧 Fazendo correções diretas no Supabase...\n');
    
    // 1. Primeiro, vou verificar o estado atual
    console.log('📋 Verificando estado atual...');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (companiesError) {
      console.error('❌ Erro ao acessar companies:', companiesError);
      return;
    }
    
    console.log('✅ Tabela companies acessível');
    if (companies.length > 0) {
      console.log('📊 Colunas disponíveis:', Object.keys(companies[0]));
      
      if (companies[0].cnpj !== undefined) {
        console.log('✅ Campo CNPJ já existe!');
      } else {
        console.log('❌ Campo CNPJ não existe');
      }
    }

    // 2. Tentar usar uma abordagem completamente diferente
    // Vou usar o Supabase Management API via fetch
    console.log('\n🔧 Tentando usar Management API...');
    
    const managementUrl = `${supabaseUrl}/rest/v1/rpc/exec_sql`;
    
    // Teste com ALTER TABLE via fetch direto
    const alterResponse = await fetch(managementUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: 'ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnpj TEXT;'
      })
    });
    
    const alterResult = await alterResponse.json();
    
    if (alterResponse.ok) {
      console.log('✅ Campo CNPJ adicionado via Management API');
    } else {
      console.log('❌ Management API não funcionou:', alterResult);
      
      // 3. Última tentativa: usar uma função customizada temporária
      console.log('\n🔄 Tentando abordagem alternativa...');
      
      // Vou tentar criar uma função temporária
      const { data: functionResult, error: functionError } = await supabase.rpc('sql', {
        query: `
          CREATE OR REPLACE FUNCTION temp_add_cnpj()
          RETURNS TEXT AS $$
          BEGIN
            ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnpj TEXT;
            RETURN 'CNPJ column added';
          END;
          $$ LANGUAGE plpgsql;
        `
      });
      
      if (functionError) {
        console.log('❌ Não conseguiu criar função temporária:', functionError.message);
      } else {
        console.log('✅ Função temporária criada, executando...');
        
        const { data: execResult, error: execError } = await supabase.rpc('temp_add_cnpj');
        
        if (execError) {
          console.log('❌ Erro ao executar função:', execError.message);
        } else {
          console.log('✅ Função executada:', execResult);
        }
      }
    }

    // 4. Verificar se funcionou
    console.log('\n🔍 Verificação final...');
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('companies')
      .select('id, name, cnpj')
      .limit(1);
    
    if (finalError) {
      console.log('❌ Verificação final falhou:', finalError.message);
    } else {
      console.log('✅ Verificação final bem-sucedida');
      if (finalCheck.length > 0) {
        console.log('📊 Estrutura atual:', Object.keys(finalCheck[0]));
        console.log('🎯 Dados de exemplo:', finalCheck[0]);
      }
    }

    console.log('\n🎯 Processo finalizado');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  }
}

directSupabaseFix();