import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductsSchema() {
  try {
    console.log('🔍 Checking products table schema...');
    
    // Try to query the products table structure
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying products table:', error);
      return;
    }
    
    console.log('✅ Products table exists and accessible');
    console.log('Sample data structure:', data);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkProductsSchema();