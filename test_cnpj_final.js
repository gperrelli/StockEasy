import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCNPJFinal() {
  console.log('🔍 Teste final do campo CNPJ e sistema...\n');

  // 1. Testar campo CNPJ com nome correto
  console.log('1. 📋 Testando campo CNPJ (maiúsculo):');
  const { data: cnpjTest, error: cnpjError } = await supabase
    .from('companies')
    .select('id, name, CNPJ')
    .limit(1);

  if (cnpjError) {
    console.log('❌ Erro:', cnpjError.message);
  } else {
    console.log('✅ Campo CNPJ funcionando!');
    if (cnpjTest && cnpjTest.length > 0) {
      console.log(`📊 Empresa: ${cnpjTest[0].name}`);
      console.log(`📋 CNPJ: ${cnpjTest[0].CNPJ || 'null (não preenchido ainda)'}`);
    }
  }

  // 2. Testar inserção de CNPJ
  console.log('\n2. ✏️  Testando atualização do CNPJ:');
  const { data: updateTest, error: updateError } = await supabase
    .from('companies')
    .update({ CNPJ: '12.345.678/0001-99' })
    .eq('id', cnpjTest[0]?.id)
    .select('id, name, CNPJ');

  if (updateError) {
    console.log('❌ Erro ao atualizar:', updateError.message);
  } else {
    console.log('✅ CNPJ atualizado com sucesso!');
    if (updateTest && updateTest.length > 0) {
      console.log(`📊 ${updateTest[0].name} - CNPJ: ${updateTest[0].CNPJ}`);
    }
  }

  // 3. Verificar dados multi-tenant
  console.log('\n3. 🏢 Resumo dos dados multi-tenant:');
  
  const { data: allCompanies } = await supabase
    .from('companies')
    .select('id, name, CNPJ');

  const { data: allUsers } = await supabase
    .from('users')
    .select('id, name, role, company_id');

  const { data: allProducts } = await supabase
    .from('products')
    .select('id, company_id');

  console.log(`💼 Empresas: ${allCompanies?.length || 0}`);
  console.log(`👥 Usuários: ${allUsers?.length || 0}`);
  console.log(`📦 Produtos: ${allProducts?.length || 0}`);

  if (allCompanies && allCompanies.length > 0) {
    console.log('\n🏢 Detalhes das empresas:');
    for (const company of allCompanies) {
      const usersCount = allUsers?.filter(u => u.company_id === company.id).length || 0;
      const productsCount = allProducts?.filter(p => p.company_id === company.id).length || 0;
      
      console.log(`  • ${company.name} (ID: ${company.id})`);
      console.log(`    CNPJ: ${company.CNPJ || 'não preenchido'}`);
      console.log(`    Usuários: ${usersCount}, Produtos: ${productsCount}`);
    }
  }

  // 4. Verificar usuário MASTER
  console.log('\n4. 👑 Usuário MASTER:');
  const masterUser = allUsers?.find(u => u.role === 'MASTER');
  if (masterUser) {
    console.log(`✅ ${masterUser.name} (company_id: ${masterUser.company_id})`);
  } else {
    console.log('❌ Nenhum usuário MASTER encontrado');
  }

  // 5. Status final
  console.log('\n🎯 STATUS FINAL DO SISTEMA:');
  
  const cnpjOk = !cnpjError;
  const dataOk = allCompanies && allCompanies.length > 0;
  const masterOk = !!masterUser;
  
  console.log(`✅ Campo CNPJ: ${cnpjOk ? 'FUNCIONANDO' : 'ERRO'}`);
  console.log(`✅ Dados multi-tenant: ${dataOk ? 'OK' : 'ERRO'}`);
  console.log(`✅ Usuário MASTER: ${masterOk ? 'OK' : 'ERRO'}`);
  console.log(`⚠️  RLS: DESABILITADO (sistema funcionando sem políticas de segurança)`);

  if (cnpjOk && dataOk && masterOk) {
    console.log('\n🚀 SISTEMA MULTI-TENANT FUNCIONAL!');
    console.log('💡 Pronto para uso. Para produção, habilite RLS com políticas adequadas.');
  } else {
    console.log('\n⚠️  Sistema com problemas. Verifique os itens marcados como ERRO.');
  }
}

testCNPJFinal();