import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  try {
    console.log('🔍 Checking current database schema...');
    
    // Try to query the companies table structure
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying companies table:', error);
      return;
    }
    
    console.log('✅ Companies table exists and accessible');
    console.log('Sample data structure:', data);
    
    // Try creating a simple company without CNPJ first
    console.log('\n📝 Testing company creation without CNPJ...');
    const { data: newCompany, error: createError } = await supabase
      .from('companies')
      .insert({
        name: 'Test Company',
        email: 'test@example.com',
        phone: '(11) 99999-9999',
        address: 'Test Address'
      })
      .select()
      .single();
      
    if (createError) {
      console.error('❌ Error creating company:', createError);
    } else {
      console.log('✅ Company created successfully:', newCompany);
      
      // Clean up - delete the test company
      await supabase.from('companies').delete().eq('id', newCompany.id);
      console.log('🧹 Test company deleted');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkSchema();