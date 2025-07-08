
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://raqqpcyqueshhruwrngw.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhcXFwY3lxdWVzaGhydXdybmd3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQwMjU2MywiZXhwIjoyMDY2OTc4NTYzfQ.xJyJ3qluG6LQ-zQ9ZcKOHknufZq4UmCZvVPszwaLS5k';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserCompany() {
  try {
    console.log('🔧 CORRIGINDO USUÁRIO SEM EMPRESA...');
    
    // Buscar o usuário problemático
    const { data: problemUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'bonitobeeroficial@gmail.com')
      .single();
    
    if (userError) {
      console.log('❌ Erro ao buscar usuário:', userError);
      return;
    }
    
    console.log('📋 Usuário encontrado:', {
      id: problemUser.id,
      name: problemUser.name,
      email: problemUser.email,
      company_id: problemUser.company_id,
      role: problemUser.role
    });
    
    // Se o usuário não tem empresa, vamos atribuir uma
    if (!problemUser.company_id) {
      console.log('🏢 Buscando empresas disponíveis...');
      
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('id', { ascending: true });
      
      if (companiesError) {
        console.log('❌ Erro ao buscar empresas:', companiesError);
        return;
      }
      
      console.log('📊 Empresas encontradas:', companies.length);
      
      if (companies.length > 0) {
        const targetCompany = companies[0]; // Usar a primeira empresa disponível
        
        console.log(`🎯 Atribuindo usuário à empresa: ${targetCompany.name} (ID: ${targetCompany.id})`);
        
        // Atualizar o usuário
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ company_id: targetCompany.id })
          .eq('id', problemUser.id)
          .select()
          .single();
        
        if (updateError) {
          console.log('❌ Erro ao atualizar usuário:', updateError);
        } else {
          console.log('✅ USUÁRIO CORRIGIDO COM SUCESSO!');
          console.log('📋 Dados atualizados:', {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            company_id: updatedUser.company_id,
            role: updatedUser.role
          });
        }
      } else {
        console.log('❌ Nenhuma empresa encontrada. Criando nova empresa...');
        
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: 'Bonito Beer',
            email: 'bonitobeeroficial@gmail.com',
            phone: null,
            address: null,
            cnpj: null
          })
          .select()
          .single();
        
        if (createError) {
          console.log('❌ Erro ao criar empresa:', createError);
        } else {
          console.log('✅ Empresa criada:', newCompany.name);
          
          // Atualizar usuário com a nova empresa
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ company_id: newCompany.id })
            .eq('id', problemUser.id)
            .select()
            .single();
          
          if (updateError) {
            console.log('❌ Erro ao atualizar usuário:', updateError);
          } else {
            console.log('✅ USUÁRIO CORRIGIDO COM NOVA EMPRESA!');
            console.log('📋 Dados atualizados:', {
              id: updatedUser.id,
              name: updatedUser.name,
              email: updatedUser.email,
              company_id: updatedUser.company_id,
              role: updatedUser.role
            });
          }
        }
      }
    } else {
      console.log('ℹ️ Usuário já tem empresa atribuída');
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir usuário:', error);
  }
}

fixUserCompany();
