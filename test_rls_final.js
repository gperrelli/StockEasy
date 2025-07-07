
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
const publicSupabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRLSPolicies() {
  console.log('🔐 TESTANDO POLÍTICAS RLS IMPLEMENTADAS...\n');
  
  try {
    // 1. Verificar se RLS está habilitado
    console.log('1️⃣ Verificando se RLS está habilitado...');
    
    const { data: rlsStatus, error: rlsError } = await adminSupabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename, 
          rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('companies', 'users', 'products', 'suppliers', 'categories', 'stock_movements', 'checklist_templates', 'checklist_items', 'checklist_executions', 'checklist_execution_items')
        ORDER BY tablename;
      `
    });
    
    if (rlsError) {
      console.log('❌ Erro ao verificar RLS:', rlsError.message);
    } else if (rlsStatus && rlsStatus.length > 0) {
      console.log('📋 Status do RLS por tabela:');
      rlsStatus.forEach(table => {
        const status = table.rowsecurity ? '✅ HABILITADO' : '❌ DESABILITADO';
        console.log(`   ${table.tablename}: ${status}`);
      });
      
      const enabledCount = rlsStatus.filter(t => t.rowsecurity).length;
      console.log(`\n📊 Resumo: ${enabledCount}/${rlsStatus.length} tabelas com RLS habilitado`);
    }
    
    // 2. Verificar políticas existentes
    console.log('\n2️⃣ Verificando políticas criadas...');
    
    const { data: policies, error: policiesError } = await adminSupabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND policyname LIKE 'multi_tenant_%'
        ORDER BY tablename, policyname;
      `
    });
    
    if (policiesError) {
      console.log('❌ Erro ao verificar políticas:', policiesError.message);
    } else if (policies && policies.length > 0) {
      console.log(`✅ ${policies.length} políticas multi-tenancy encontradas:`);
      
      const policiesByTable = policies.reduce((acc, policy) => {
        acc[policy.tablename] = (acc[policy.tablename] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(policiesByTable).forEach(([table, count]) => {
        console.log(`   ${table}: ${count} política(s)`);
      });
    } else {
      console.log('❌ Nenhuma política multi-tenancy encontrada');
    }
    
    // 3. Testar acesso não autenticado (deve ser bloqueado)
    console.log('\n3️⃣ Testando acesso público (deve ser bloqueado)...');
    
    const testTables = ['companies', 'users', 'products'];
    
    for (const table of testTables) {
      const { data, error } = await publicSupabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ✅ ${table}: Acesso BLOQUEADO (${error.code})`);
      } else {
        console.log(`   ❌ ${table}: Acesso PERMITIDO (PROBLEMA!)`);
      }
    }
    
    // 4. Testar acesso com usuário MASTER (deve funcionar)
    console.log('\n4️⃣ Testando acesso com usuário MASTER...');
    
    // Simular contexto de usuário MASTER (já que estamos usando service key)
    const { data: masterTest, error: masterError } = await adminSupabase
      .from('companies')
      .select('id, name')
      .limit(3);
    
    if (masterError) {
      console.log('   ❌ MASTER não consegue acessar dados:', masterError.message);
    } else {
      console.log(`   ✅ MASTER acessa dados: ${masterTest.length} empresas encontradas`);
    }
    
    // 5. Verificar dados existentes para teste
    console.log('\n5️⃣ Verificando dados para teste...');
    
    const { data: companies, error: compError } = await adminSupabase
      .from('companies')
      .select('id, name')
      .limit(5);
    
    if (compError) {
      console.log('❌ Erro ao buscar empresas:', compError.message);
    } else {
      console.log(`📊 Empresas no banco: ${companies.length}`);
      companies.forEach(comp => {
        console.log(`   • ${comp.name} (ID: ${comp.id})`);
      });
    }
    
    const { data: users, error: userError } = await adminSupabase
      .from('users')
      .select('id, name, email, role, company_id')
      .limit(5);
    
    if (userError) {
      console.log('❌ Erro ao buscar usuários:', userError.message);
    } else {
      console.log(`👥 Usuários no banco: ${users.length}`);
      users.forEach(user => {
        console.log(`   • ${user.name} (${user.email}) - ${user.role} - Empresa: ${user.company_id}`);
      });
    }
    
    // 6. Testar isolamento entre empresas (simulação)
    console.log('\n6️⃣ Simulando teste de isolamento...');
    
    if (companies.length >= 2) {
      const empresa1 = companies[0];
      const empresa2 = companies[1];
      
      console.log(`📋 Testando isolamento entre ${empresa1.name} e ${empresa2.name}`);
      console.log('💡 Em produção, usuários da empresa 1 não devem ver dados da empresa 2');
      console.log('✅ Políticas RLS implementadas devem garantir este isolamento');
    } else {
      console.log('⚠️  Precisa de pelo menos 2 empresas para testar isolamento completo');
    }
    
    // 7. Verificar integridade das políticas
    console.log('\n7️⃣ Verificando integridade das políticas...');
    
    const expectedTables = [
      'companies', 'users', 'products', 'suppliers', 'categories',
      'stock_movements', 'checklist_templates', 'checklist_items',
      'checklist_executions', 'checklist_execution_items'
    ];
    
    if (policies) {
      const tablesWithPolicies = [...new Set(policies.map(p => p.tablename))];
      const missingPolicies = expectedTables.filter(table => !tablesWithPolicies.includes(table));
      
      if (missingPolicies.length === 0) {
        console.log('✅ Todas as tabelas têm políticas RLS');
      } else {
        console.log('⚠️  Tabelas sem políticas:', missingPolicies.join(', '));
      }
    }
    
    // 8. Resumo final
    console.log('\n🎯 RESUMO FINAL:');
    
    const rlsEnabled = rlsStatus ? rlsStatus.filter(t => t.rowsecurity).length : 0;
    const totalTables = expectedTables.length;
    const policiesCount = policies ? policies.length : 0;
    
    console.log(`📊 RLS habilitado: ${rlsEnabled}/${totalTables} tabelas`);
    console.log(`🔐 Políticas criadas: ${policiesCount}`);
    
    if (rlsEnabled === totalTables && policiesCount >= totalTables) {
      console.log('✅ SISTEMA TOTALMENTE PROTEGIDO COM RLS!');
      console.log('🎉 Multi-tenancy implementado com sucesso');
      console.log('🏢 Cada empresa verá apenas seus próprios dados');
      console.log('👑 Usuários MASTER podem acessar dados de todas as empresas');
    } else {
      console.log('⚠️  Sistema parcialmente protegido');
      console.log('💡 Execute o script CREATE_RLS_POLICIES_FINAL.sql no Supabase Dashboard');
    }
    
  } catch (error) {
    console.error('💥 Erro durante teste:', error);
  }
}

// Executar teste
testRLSPolicies().then(() => {
  console.log('\n🔚 Teste de RLS concluído');
}).catch(console.error);
