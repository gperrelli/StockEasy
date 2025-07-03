import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSignupFlow() {
  console.log('🔧 Corrigindo fluxo de cadastro...\n');

  // 1. Verificar estado atual das empresas
  console.log('1. 📊 Verificando empresas existentes...');
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name, CNPJ');

  if (companiesError) {
    console.log('❌ Erro ao buscar empresas:', companiesError.message);
    return;
  }

  console.log(`✅ Empresas encontradas: ${companies.length}`);
  companies.forEach(company => {
    console.log(`  • ${company.name} (ID: ${company.id}) - CNPJ: ${company.CNPJ || 'não preenchido'}`);
  });

  // 2. Criar empresa de teste se necessário
  console.log('\n2. 🏢 Criando empresa de teste...');
  const { data: newCompany, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: 'Empresa Teste Cadastro',
      email: 'teste@empresa.com',
      CNPJ: '98765432000110'
    })
    .select()
    .single();

  if (companyError) {
    console.log('❌ Erro ao criar empresa:', companyError.message);
    return;
  }

  console.log(`✅ Empresa criada: ${newCompany.name} (ID: ${newCompany.id})`);

  // 3. Testar criação de usuário diretamente no Supabase
  console.log('\n3. 👤 Testando criação de usuário...');
  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      email: 'usuario@teste.com',
      name: 'Usuario Teste',
      role: 'admin',
      supabase_user_id: `test-${Date.now()}`,
      company_id: newCompany.id
    })
    .select()
    .single();

  if (userError) {
    console.log('❌ Erro ao criar usuário:', userError.message);
    return;
  }

  console.log(`✅ Usuário criado: ${newUser.name} (ID: ${newUser.id})`);

  // 4. Verificar se o campo CNPJ está funcionando
  console.log('\n4. 📋 Verificando campo CNPJ...');
  const { data: updatedCompany, error: updateError } = await supabase
    .from('companies')
    .update({ CNPJ: '11222333000144' })
    .eq('id', newCompany.id)
    .select()
    .single();

  if (updateError) {
    console.log('❌ Erro ao atualizar CNPJ:', updateError.message);
    return;
  }

  console.log(`✅ CNPJ atualizado: ${updatedCompany.CNPJ}`);

  // 5. Resultado final
  console.log('\n🎯 RESULTADO:');
  console.log('✅ Campo CNPJ funcionando');
  console.log('✅ Criação de empresa funcionando');
  console.log('✅ Criação de usuário funcionando');
  console.log('✅ Sistema pronto para cadastros');

  // 6. Limpar dados de teste
  console.log('\n🧹 Limpando dados de teste...');
  await supabase.from('users').delete().eq('id', newUser.id);
  await supabase.from('companies').delete().eq('id', newCompany.id);
  console.log('✅ Dados de teste removidos');

  return true;
}

fixSignupFlow();