import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsersSchema() {
  try {
    console.log('🔍 Checking users table schema...');
    
    // Try to query the users table structure
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying users table:', error);
      return;
    }
    
    console.log('✅ Users table exists and accessible');
    console.log('Sample data structure:', data);
    
    // Try creating a simple user to see which fields are required
    console.log('\n📝 Testing user creation with minimal fields...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        name: 'Test User',
        email: 'test-user@example.com',
        role: 'operador'
      })
      .select()
      .single();
      
    if (createError) {
      console.error('❌ Error creating user:', createError);
    } else {
      console.log('✅ User created successfully:', newUser);
      
      // Clean up - delete the test user
      await supabase.from('users').delete().eq('id', newUser.id);
      console.log('🧹 Test user deleted');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkUsersSchema();