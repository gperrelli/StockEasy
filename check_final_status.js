import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFinalStatus() {
  try {
    console.log('🔍 Verificação final do sistema multi-tenant...\n');
    
    // 1. Verificar campo CNPJ
    console.log('1. 📋 Campo CNPJ:');
    const { data: cnpjTest, error: cnpjError } = await supabase
      .from('companies')
      .select('id, name, CNPJ, cnpj')
      .limit(1);
    
    if (cnpjTest && cnpjTest.length > 0) {
      const company = cnpjTest[0];
      const hasCNPJ = company.CNPJ !== undefined || company.cnpj !== undefined;
      console.log(`   ✅ Campo CNPJ existe: ${hasCNPJ ? 'SIM' : 'NÃO'}`);
      if (hasCNPJ) {
        console.log(`   📊 Exemplo: ${company.name} - CNPJ: ${company.CNPJ || company.cnpj || 'null'}`);
      }
    } else {
      console.log('   ❌ Erro ao verificar CNPJ:', cnpjError?.message);
    }

    // 2. Verificar RLS habilitado
    console.log('\n2. 🔒 RLS habilitado:');
    const publicSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: publicTest, error: publicError } = await publicSupabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (publicError) {
      console.log('   ✅ RLS funcionando - acesso público negado');
      console.log(`   📋 Erro esperado: ${publicError.message.substring(0, 80)}...`);
    } else {
      console.log('   ❌ RLS não funcionando - dados acessíveis publicamente');
    }

    // 3. Verificar políticas existentes
    console.log('\n3. 📜 Políticas RLS:');
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname;
      `
    });
    
    if (policiesError) {
      console.log('   ⚠️  Não foi possível verificar políticas via RPC');
      console.log('   💡 Use SQL Editor para verificar: SELECT * FROM pg_policies WHERE schemaname = \'public\';');
    } else if (policies && policies.length > 0) {
      console.log(`   ✅ ${policies.length} políticas encontradas:`);
      const groupedPolicies = policies.reduce((acc, policy) => {
        acc[policy.tablename] = (acc[policy.tablename] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(groupedPolicies).forEach(([table, count]) => {
        console.log(`      ${table}: ${count} política(s)`);
      });
    } else {
      console.log('   ❌ Nenhuma política RLS encontrada');
    }

    // 4. Dados multi-tenant
    console.log('\n4. 🏢 Dados multi-tenant:');
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name');
    
    console.log(`   💼 Empresas: ${companies?.length || 0}`);
    
    if (companies && companies.length > 0) {
      for (const company of companies) {
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('company_id', company.id);
        
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('company_id', company.id);
        
        console.log(`      ${company.name} (ID: ${company.id}): ${users?.length || 0} usuários, ${products?.length || 0} produtos`);
      }
    }

    // 5. Usuário MASTER
    console.log('\n5. 👑 Usuário MASTER:');
    const { data: masterUsers } = await supabase
      .from('users')
      .select('name, email, role, company_id')
      .eq('role', 'MASTER');
    
    if (masterUsers && masterUsers.length > 0) {
      console.log('   ✅ Usuário(s) MASTER configurado(s):');
      masterUsers.forEach(user => {
        console.log(`      ${user.name} (${user.email}) - company_id: ${user.company_id}`);
      });
    } else {
      console.log('   ❌ Nenhum usuário MASTER encontrado');
    }

    // 6. Resumo final
    console.log('\n🎯 RESUMO MULTI-TENANCY:');
    
    const cnpjOk = cnpjTest && cnpjTest.length > 0 && (cnpjTest[0].CNPJ !== undefined || cnpjTest[0].cnpj !== undefined);
    const rlsOk = !!publicError;
    const dataOk = companies && companies.length > 0;
    const masterOk = masterUsers && masterUsers.length > 0;
    
    console.log(`   Campo CNPJ: ${cnpjOk ? '✅' : '❌'}`);
    console.log(`   RLS Ativo: ${rlsOk ? '✅' : '❌'}`);
    console.log(`   Dados Teste: ${dataOk ? '✅' : '❌'}`);
    console.log(`   Usuário MASTER: ${masterOk ? '✅' : '❌'}`);
    
    const allGood = cnpjOk && rlsOk && dataOk && masterOk;
    
    if (allGood) {
      console.log('\n🚀 SISTEMA MULTI-TENANT COMPLETO E FUNCIONAL!');
    } else {
      console.log('\n⚠️  Sistema parcialmente configurado. Próximos passos:');
      
      if (!cnpjOk) console.log('   - Verificar campo CNPJ na tabela companies');
      if (!rlsOk) console.log('   - Criar políticas RLS (ver RLS_POLICIES_MANUAL.md)');
      if (!dataOk) console.log('   - Criar dados de exemplo para teste');
      if (!masterOk) console.log('   - Configurar usuário MASTER');
    }

  } catch (error) {
    console.error('💥 Erro na verificação:', error.message);
  }
}

checkFinalStatus();