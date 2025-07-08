
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://raqqpcyqueshhruwrngw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhcXFwY3lxdWVzaGhydXdybmd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjAwMTE3MSwiZXhwIjoyMDUxNTc3MTcxfQ.QQNr0UmjYLTe1e0A5RdXpXHuJhCnwqGZi12uBR0nPZ4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixAllUsersCompanies() {
  console.log('🔍 VERIFICANDO TODOS OS USUÁRIOS SEM EMPRESA...\n');

  try {
    // 1. Buscar todos os usuários
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('id', { ascending: true });

    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`📊 Total de usuários encontrados: ${allUsers.length}\n`);

    // 2. Categorizar usuários
    const masterUsers = allUsers.filter(user => user.role === 'MASTER');
    const usersWithoutCompany = allUsers.filter(user => !user.company_id && user.role !== 'MASTER');
    const usersWithCompany = allUsers.filter(user => user.company_id && user.role !== 'MASTER');

    console.log('📈 ESTATÍSTICAS:');
    console.log(`   👑 Usuários MASTER: ${masterUsers.length}`);
    console.log(`   🏢 Usuários com empresa: ${usersWithCompany.length}`);
    console.log(`   ⚠️  Usuários SEM empresa: ${usersWithoutCompany.length}\n`);

    // 3. Mostrar usuários MASTER (devem ter company_id null)
    if (masterUsers.length > 0) {
      console.log('👑 USUÁRIOS MASTER (correto ter company_id null):');
      masterUsers.forEach(user => {
        console.log(`   ✅ ${user.name} (${user.email}) - Company ID: ${user.company_id}`);
      });
      console.log('');
    }

    // 4. Mostrar usuários com empresa (situação normal)
    if (usersWithCompany.length > 0) {
      console.log('🏢 USUÁRIOS COM EMPRESA (situação normal):');
      usersWithCompany.forEach(user => {
        console.log(`   ✅ ${user.name} (${user.email}) - Company ID: ${user.company_id}`);
      });
      console.log('');
    }

    // 5. Mostrar usuários sem empresa (PROBLEMA!)
    if (usersWithoutCompany.length > 0) {
      console.log('⚠️  USUÁRIOS SEM EMPRESA (NECESSÁRIO CORRIGIR):');
      usersWithoutCompany.forEach(user => {
        console.log(`   ❌ ${user.name} (${user.email}) - Role: ${user.role} - Company ID: ${user.company_id}`);
      });
      console.log('');

      // 6. Buscar empresas disponíveis
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('id', { ascending: true });

      if (companiesError) {
        console.log('❌ Erro ao buscar empresas:', companiesError);
        return;
      }

      console.log('🏢 EMPRESAS DISPONÍVEIS:');
      companies.forEach(company => {
        console.log(`   ID ${company.id}: ${company.name} (${company.email})`);
      });
      console.log('');

      // 7. Tentar corrigir automaticamente baseado no email
      console.log('🔧 TENTANDO CORREÇÃO AUTOMÁTICA...\n');

      for (const user of usersWithoutCompany) {
        console.log(`🔍 Processando usuário: ${user.name} (${user.email})`);

        // Tentar encontrar empresa baseada no email
        let targetCompany = null;

        // Verificar se o domínio do email coincide com alguma empresa
        const userDomain = user.email.split('@')[1];
        targetCompany = companies.find(company => 
          company.email && company.email.split('@')[1] === userDomain
        );

        // Se não encontrou por domínio, tentar por nome
        if (!targetCompany) {
          const userName = user.name.toLowerCase();
          targetCompany = companies.find(company => 
            company.name.toLowerCase().includes(userName) || 
            userName.includes(company.name.toLowerCase().split(' ')[0])
          );
        }

        // Se ainda não encontrou e há apenas uma empresa, usar ela
        if (!targetCompany && companies.length === 1) {
          targetCompany = companies[0];
          console.log(`   💡 Usando única empresa disponível: ${targetCompany.name}`);
        }

        // Se encontrou uma empresa, atribuir
        if (targetCompany) {
          console.log(`   🎯 Empresa identificada: ${targetCompany.name} (ID: ${targetCompany.id})`);
          
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ company_id: targetCompany.id })
            .eq('id', user.id)
            .select()
            .single();

          if (updateError) {
            console.log(`   ❌ Erro ao atualizar usuário: ${updateError.message}`);
          } else {
            console.log(`   ✅ Usuário atualizado com sucesso! Company ID: ${updatedUser.company_id}`);
          }
        } else {
          console.log(`   ❓ Não foi possível identificar empresa automaticamente`);
          
          // Criar nova empresa baseada no usuário
          if (companies.length === 0 || user.email.includes('bonito')) {
            const newCompanyName = user.email.includes('bonito') ? 'Bonito Beer' : `Empresa ${user.name}`;
            
            console.log(`   🏗️  Criando nova empresa: ${newCompanyName}`);
            
            const { data: newCompany, error: createError } = await supabase
              .from('companies')
              .insert({
                name: newCompanyName,
                email: user.email,
                phone: null,
                address: null,
                cnpj: null
              })
              .select()
              .single();

            if (createError) {
              console.log(`   ❌ Erro ao criar empresa: ${createError.message}`);
            } else {
              console.log(`   ✅ Empresa criada com ID: ${newCompany.id}`);
              
              // Atribuir usuário à nova empresa
              const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update({ company_id: newCompany.id })
                .eq('id', user.id)
                .select()
                .single();

              if (updateError) {
                console.log(`   ❌ Erro ao atualizar usuário: ${updateError.message}`);
              } else {
                console.log(`   ✅ Usuário atualizado com nova empresa! Company ID: ${updatedUser.company_id}`);
              }
            }
          }
        }
        console.log('');
      }
    } else {
      console.log('✅ TODOS OS USUÁRIOS ESTÃO CORRETAMENTE CONFIGURADOS!\n');
    }

    // 8. Verificação final
    console.log('📊 VERIFICAÇÃO FINAL...\n');
    
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select(`
        *,
        companies (
          id,
          name,
          email
        )
      `)
      .order('id', { ascending: true });

    if (finalError) {
      console.log('❌ Erro na verificação final:', finalError);
      return;
    }

    const finalProblems = finalUsers.filter(user => !user.company_id && user.role !== 'MASTER');
    
    if (finalProblems.length === 0) {
      console.log('🎉 SUCESSO! TODOS OS USUÁRIOS ESTÃO CORRETAMENTE CONFIGURADOS!');
      console.log('✅ Não há mais usuários sem empresa (exceto MASTER)');
      console.log('✅ Sistema multi-tenant funcionando corretamente');
    } else {
      console.log(`⚠️  Ainda há ${finalProblems.length} usuário(s) com problema:`);
      finalProblems.forEach(user => {
        console.log(`   ❌ ${user.name} (${user.email}) - Company ID: ${user.company_id}`);
      });
    }

    console.log('\n📋 RESUMO FINAL:');
    const finalMaster = finalUsers.filter(u => u.role === 'MASTER');
    const finalWithCompany = finalUsers.filter(u => u.company_id && u.role !== 'MASTER');
    const finalWithoutCompany = finalUsers.filter(u => !u.company_id && u.role !== 'MASTER');

    console.log(`   👑 Usuários MASTER: ${finalMaster.length}`);
    console.log(`   🏢 Usuários com empresa: ${finalWithCompany.length}`);
    console.log(`   ❌ Usuários sem empresa: ${finalWithoutCompany.length}`);
    
    if (finalWithoutCompany.length === 0) {
      console.log('\n🎯 SISTEMA PRONTO PARA PRODUÇÃO!');
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

checkAndFixAllUsersCompanies().catch(console.error);
