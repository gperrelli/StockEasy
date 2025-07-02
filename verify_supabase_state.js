// Script para verificar estado real do Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyState() {
  console.log('🔍 Verificando estado do Supabase...');
  
  try {
    // Verificar empresas
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');
    
    if (companiesError) {
      console.log('❌ Erro ao buscar companies:', companiesError);
    } else {
      console.log('🏢 Companies found:', companies.length);
      companies.forEach(company => {
        console.log(`   - ${company.name} (ID: ${company.id}, CNPJ: ${company.cnpj})`);
      });
    }

    // Verificar usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, company_id, role');
    
    if (usersError) {
      console.log('❌ Erro ao buscar users:', usersError);
    } else {
      console.log('👥 Users found:', users.length);
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}, Company: ${user.company_id}`);
      });
    }

    // Verificar status RLS
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_rls_status');
    
    if (rlsError) {
      console.log('⚠️ Could not check RLS status:', rlsError.message);
    } else {
      console.log('🔒 RLS Status:', rlsStatus);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

verifyState();