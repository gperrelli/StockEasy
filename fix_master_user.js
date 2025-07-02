// Script para corrigir usuário MASTER
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMasterUser() {
  console.log('🔧 Fixing MASTER user...');
  
  try {
    // Update MASTER user to have company_id = null
    const { data, error } = await supabase
      .from('users')
      .update({ 
        company_id: null,
        name: 'Admin MASTER' 
      })
      .eq('email', 'gerencia@loggme.com.br')
      .eq('role', 'MASTER')
      .select();
    
    if (error) {
      console.log('❌ Error updating MASTER user:', error);
    } else {
      console.log('✅ MASTER user updated:', data);
    }

    // Verify the fix
    const { data: masterUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'gerencia@loggme.com.br')
      .single();
    
    if (verifyError) {
      console.log('❌ Error verifying:', verifyError);
    } else {
      console.log('🔍 MASTER user after fix:', masterUser);
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

fixMasterUser();