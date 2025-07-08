import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 DESABILITANDO RLS TEMPORARIAMENTE...\n');

const tables = [
  'companies', 'users', 'products', 'suppliers', 
  'categories', 'stock_movements', 'checklist_templates',
  'checklist_items', 'checklist_executions'
];

for (const table of tables) {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`
    });
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: RLS desabilitado`);
    }
  } catch (err) {
    console.log(`❌ ${table}: ${err.message}`);
  }
}

console.log('\n🎉 RLS DESABILITADO! Agora teste o servidor.');
