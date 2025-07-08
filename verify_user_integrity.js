
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://raqqpcyqueshhruwrngw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhcXFwY3lxdWVzaGhydXdybmd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjAwMTE3MSwiZXhwIjoyMDUxNTc3MTcxfQ.QQNr0UmjYLTe1e0A5RdXpXHuJhCnwqGZi12uBR0nPZ4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyUserIntegrity() {
  console.log('🔍 VERIFICAÇÃO DE INTEGRIDADE DOS USUÁRIOS\n');
  
  try {
    // Buscar todos os usuários
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        company_id,
        companies (
          id,
          name
        )
      `)
      .order('id');

    if (error) {
      console.log('❌ Erro ao buscar usuários:', error);
      return false;
    }

    let hasProblems = false;
    
    console.log(`📊 Verificando ${users.length} usuários...\n`);

    for (const user of users) {
      const hasCompany = !!user.company_id;
      const isMaster = user.role === 'MASTER';
      
      if (!hasCompany && !isMaster) {
        console.log(`🚨 PROBLEMA: ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role} | Company ID: ${user.company_id}`);
        console.log(`   Status: Usuário sem empresa que não é MASTER`);
        hasProblems = true;
      } else if (hasCompany && isMaster) {
        console.log(`⚠️  ATENÇÃO: ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role} | Company ID: ${user.company_id}`);
        console.log(`   Status: Usuário MASTER com empresa (pode estar correto)`);
      } else {
        console.log(`✅ OK: ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role} | Company: ${user.companies?.name || 'N/A'}`);
      }
      console.log('');
    }

    if (!hasProblems) {
      console.log('🎉 TODOS OS USUÁRIOS ESTÃO CORRETAMENTE CONFIGURADOS!');
      console.log('✅ Integridade do sistema confirmada');
      return true;
    } else {
      console.log('❌ PROBLEMAS ENCONTRADOS NA INTEGRIDADE DOS USUÁRIOS');
      console.log('💡 Execute o script fix_all_users_companies.js para corrigir');
      return false;
    }

  } catch (error) {
    console.error('💥 Erro na verificação:', error);
    return false;
  }
}

// Executar verificação
verifyUserIntegrity().then(isHealthy => {
  console.log(`\n🏥 Status do sistema: ${isHealthy ? 'SAUDÁVEL' : 'REQUER ATENÇÃO'}`);
  process.exit(isHealthy ? 0 : 1);
});
