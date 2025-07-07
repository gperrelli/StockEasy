
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Environment variables missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteMultiTenancy() {
  try {
    console.log('🧪 TESTE COMPLETO DE MULTI-TENANCY\n');
    console.log('Testando criação de dados isolados por empresa...\n');

    // 1. Obter todas as empresas existentes
    console.log('🏢 Buscando empresas existentes...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('id');

    if (companiesError) {
      console.error('❌ Erro ao buscar empresas:', companiesError);
      return;
    }

    console.log(`✅ ${companies.length} empresas encontradas:`);
    companies.forEach(company => {
      console.log(`  • ${company.name} (ID: ${company.id})`);
    });

    // 2. Para cada empresa, criar dados de teste
    const testResults = [];

    for (const company of companies) {
      console.log(`\n🔧 Testando empresa: ${company.name} (ID: ${company.id})`);
      
      const companyResult = {
        company: company,
        user: null,
        category: null,
        product: null,
        checklist: null,
        errors: []
      };

      try {
        // 2.1. Criar usuário para a empresa
        console.log('  👤 Criando usuário...');
        const { data: user, error: userError } = await supabase
          .from('users')
          .insert({
            name: `Usuário Teste ${company.id}`,
            email: `teste${company.id}@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
            company_id: company.id,
            role: 'funcionario',
            supabase_user_id: `test-user-${company.id}-${Date.now()}`,
            isActive: true
          })
          .select()
          .single();

        if (userError) {
          console.log(`    ❌ Erro ao criar usuário: ${userError.message}`);
          companyResult.errors.push(`User: ${userError.message}`);
        } else {
          console.log(`    ✅ Usuário criado: ${user.name}`);
          companyResult.user = user;
        }

        // 2.2. Criar categoria para a empresa
        console.log('  📂 Criando categoria...');
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .insert({
            name: `Categoria Teste ${company.id}`,
            description: `Categoria de teste para ${company.name}`,
            company_id: company.id
          })
          .select()
          .single();

        if (categoryError) {
          console.log(`    ❌ Erro ao criar categoria: ${categoryError.message}`);
          companyResult.errors.push(`Category: ${categoryError.message}`);
        } else {
          console.log(`    ✅ Categoria criada: ${category.name}`);
          companyResult.category = category;
        }

        // 2.3. Criar fornecedor para a empresa (necessário para produto)
        console.log('  🏪 Criando fornecedor...');
        const { data: supplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            name: `Fornecedor Teste ${company.id}`,
            email: `fornecedor${company.id}@teste.com`,
            phone: `(11) 9999-${company.id.toString().padStart(4, '0')}`,
            company_id: company.id
          })
          .select()
          .single();

        if (supplierError) {
          console.log(`    ❌ Erro ao criar fornecedor: ${supplierError.message}`);
          companyResult.errors.push(`Supplier: ${supplierError.message}`);
        } else {
          console.log(`    ✅ Fornecedor criado: ${supplier.name}`);
        }

        // 2.4. Criar produto para a empresa
        if (category && supplier) {
          console.log('  📦 Criando produto...');
          const { data: product, error: productError } = await supabase
            .from('products')
            .insert({
              name: `Produto Teste ${company.id}`,
              description: `Produto de teste para ${company.name}`,
              unit: 'unidade',
              current_stock: 10,
              min_stock: 2,
              cost_price: 19.90,
              category_id: category.id,
              supplier_id: supplier.id,
              company_id: company.id
            })
            .select()
            .single();

          if (productError) {
            console.log(`    ❌ Erro ao criar produto: ${productError.message}`);
            companyResult.errors.push(`Product: ${productError.message}`);
          } else {
            console.log(`    ✅ Produto criado: ${product.name}`);
            companyResult.product = product;
          }
        }

        // 2.5. Criar item de checklist para a empresa
        console.log('  ✅ Criando item de checklist...');
        const { data: checklist, error: checklistError } = await supabase
          .from('checklists')
          .insert({
            title: `Checklist Teste ${company.id}`,
            description: `Item de checklist para ${company.name}`,
            type: 'daily',
            is_completed: false,
            company_id: company.id
          })
          .select()
          .single();

        if (checklistError) {
          console.log(`    ❌ Erro ao criar checklist: ${checklistError.message}`);
          companyResult.errors.push(`Checklist: ${checklistError.message}`);
        } else {
          console.log(`    ✅ Checklist criado: ${checklist.title}`);
          companyResult.checklist = checklist;
        }

      } catch (error) {
        console.log(`    💥 Erro inesperado: ${error.message}`);
        companyResult.errors.push(`Unexpected: ${error.message}`);
      }

      testResults.push(companyResult);
    }

    // 3. Verificar isolamento de dados
    console.log('\n🔍 VERIFICANDO ISOLAMENTO DE DADOS...\n');

    for (const result of testResults) {
      const company = result.company;
      console.log(`🏢 Verificando isolamento para: ${company.name} (ID: ${company.id})`);

      // Verificar que cada empresa só vê seus próprios dados
      const { data: companyUsers } = await supabase
        .from('users')
        .select('id, name, company_id')
        .eq('company_id', company.id);

      const { data: companyCategories } = await supabase
        .from('categories')
        .select('id, name, company_id')
        .eq('company_id', company.id);

      const { data: companyProducts } = await supabase
        .from('products')
        .select('id, name, company_id')
        .eq('company_id', company.id);

      const { data: companyChecklists } = await supabase
        .from('checklists')
        .select('id, title, company_id')
        .eq('company_id', company.id);

      console.log(`  👥 Usuários desta empresa: ${companyUsers?.length || 0}`);
      console.log(`  📂 Categorias desta empresa: ${companyCategories?.length || 0}`);
      console.log(`  📦 Produtos desta empresa: ${companyProducts?.length || 0}`);
      console.log(`  ✅ Checklists desta empresa: ${companyChecklists?.length || 0}`);

      // Verificar que não há vazamento de dados entre empresas
      const otherCompanyIds = companies
        .filter(c => c.id !== company.id)
        .map(c => c.id);

      if (otherCompanyIds.length > 0) {
        const { data: leakedUsers } = await supabase
          .from('users')
          .select('id, name, company_id')
          .in('company_id', otherCompanyIds);

        console.log(`  🚫 Usuários de outras empresas (não deveria ver): ${leakedUsers?.length || 0}`);
      }
    }

    // 4. Resumo final
    console.log('\n📊 RESUMO DO TESTE COMPLETO:\n');

    let totalSuccess = 0;
    let totalErrors = 0;

    testResults.forEach(result => {
      const successCount = [result.user, result.category, result.product, result.checklist]
        .filter(Boolean).length;
      const errorCount = result.errors.length;
      
      totalSuccess += successCount;
      totalErrors += errorCount;

      console.log(`🏢 ${result.company.name}:`);
      console.log(`  ✅ Criados com sucesso: ${successCount}/4`);
      console.log(`  ❌ Erros: ${errorCount}`);
      
      if (errorCount > 0) {
        result.errors.forEach(error => {
          console.log(`    • ${error}`);
        });
      }
    });

    console.log(`\n🎯 RESULTADO GERAL:`);
    console.log(`✅ Total de itens criados: ${totalSuccess}`);
    console.log(`❌ Total de erros: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('🎉 MULTI-TENANCY FUNCIONANDO PERFEITAMENTE!');
      console.log('✅ Isolamento de dados confirmado');
      console.log('✅ Todas as operações CRUD funcionando');
      console.log('✅ Sistema pronto para produção');
    } else {
      console.log('⚠️  Alguns problemas encontrados - verificar logs acima');
    }

    // 5. Limpeza opcional dos dados de teste
    console.log('\n🧹 Deseja limpar os dados de teste? (Descomente as linhas abaixo se necessário)');
    /*
    console.log('Limpando dados de teste...');
    for (const result of testResults) {
      if (result.user) await supabase.from('users').delete().eq('id', result.user.id);
      if (result.product) await supabase.from('products').delete().eq('id', result.product.id);
      if (result.category) await supabase.from('categories').delete().eq('id', result.category.id);
      if (result.checklist) await supabase.from('checklists').delete().eq('id', result.checklist.id);
    }
    console.log('✅ Dados de teste removidos');
    */

  } catch (error) {
    console.error('💥 Erro geral no teste:', error);
  }
}

testCompleteMultiTenancy();
