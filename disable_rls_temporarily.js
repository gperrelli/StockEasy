// Script para desabilitar RLS temporariamente para testes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableRLS() {
  console.log('🔓 Desabilitando RLS temporariamente para testes...');
  
  const tables = [
    'companies', 'users', 'products', 'suppliers', 
    'categories', 'stock_movements', 'checklist_templates',
    'checklist_items', 'checklist_executions', 'checklist_execution_items'
  ];

  for (const table of tables) {
    try {
      const { error } = await supabase.rpc('disable_rls_on_table', { table_name: table });
      if (error) {
        console.log(`❌ Error disabling RLS on ${table}:`, error.message);
      } else {
        console.log(`✅ RLS disabled on ${table}`);
      }
    } catch (err) {
      console.log(`⚠️ Could not disable RLS on ${table}, using SQL fallback`);
    }
  }
}

disableRLS();