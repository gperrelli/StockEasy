/**
 * Script para continuar criando dados de exemplo na empresa existente
 * Usando o cliente Supabase diretamente - sem APIs intermediárias
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createExampleData() {
  try {
    console.log('🚀 Creating example data using Supabase client directly...');
    
    // Use existing company ID 5 (Pizzaria Exemplo)
    const company = { id: 5, name: 'Pizzaria Exemplo' };
    console.log('✅ Using existing company:', company);
    
    // 2. Create admin user for the company
    console.log('👤 Creating admin user: João Silva');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        name: 'João Silva',
        email: 'joao@pizzariaexemplo.com.br',
        company_id: company.id,
        role: 'admin',
        supabase_user_id: `mock-admin-${Date.now()}`
      })
      .select()
      .single();
      
    if (userError) {
      console.error('❌ Error creating user:', userError);
      return;
    }
    
    console.log('✅ Admin user created:', user);
    
    // 3. Create some categories
    console.log('📂 Creating categories...');
    const categories = [
      { name: 'Pizzas', description: 'Pizzas tradicionais e especiais', company_id: company.id },
      { name: 'Bebidas', description: 'Refrigerantes, sucos e cervejas', company_id: company.id },
      { name: 'Ingredientes', description: 'Ingredientes para preparo', company_id: company.id }
    ];
    
    const { data: createdCategories, error: categoriesError } = await supabase
      .from('categories')
      .insert(categories)
      .select();
      
    if (categoriesError) {
      console.error('❌ Error creating categories:', categoriesError);
      return;
    }
    
    console.log('✅ Categories created:', createdCategories.length);
    
    // 4. Create a supplier
    console.log('🏪 Creating supplier...');
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .insert({
        name: 'Distribuidora São Paulo',
        email: 'vendas@distsp.com.br',
        phone: '(11) 3333-4444',
        address: 'Av. Industrial, 1000 - São Paulo, SP',
        company_id: company.id
      })
      .select()
      .single();
      
    if (supplierError) {
      console.error('❌ Error creating supplier:', supplierError);
      return;
    }
    
    console.log('✅ Supplier created:', supplier);
    
    // 5. Create some products
    console.log('📦 Creating products...');
    const products = [
      {
        name: 'Pizza Margherita',
        description: 'Pizza com molho de tomate, mussarela e manjericão',
        unit: 'unidade',
        current_stock: 0, // Pizza é feita sob demanda
        min_stock: 0,
        cost_price: 35.90,
        category_id: createdCategories[0].id,
        supplier_id: supplier.id,
        company_id: company.id
      },
      {
        name: 'Coca-Cola 2L',
        description: 'Refrigerante Coca-Cola 2 litros',
        unit: 'unidade',
        current_stock: 24,
        min_stock: 5,
        cost_price: 8.50,
        category_id: createdCategories[1].id,
        supplier_id: supplier.id,
        company_id: company.id
      },
      {
        name: 'Queijo Mussarela',
        description: 'Queijo mussarela fatiado 1kg',
        unit: 'kg',
        current_stock: 5,
        min_stock: 2,
        cost_price: 28.90,
        category_id: createdCategories[2].id,
        supplier_id: supplier.id,
        company_id: company.id
      }
    ];
    
    const { data: createdProducts, error: productsError } = await supabase
      .from('products')
      .insert(products)
      .select();
      
    if (productsError) {
      console.error('❌ Error creating products:', productsError);
      return;
    }
    
    console.log('✅ Products created:', createdProducts.length);
    
    console.log('\n🎉 Example data created successfully using Supabase client directly!');
    console.log('📊 Summary:');
    console.log(`- Company: ${company.name} (ID: ${company.id})`);
    console.log(`- Admin User: ${user.name} (${user.email})`);
    console.log(`- Categories: ${createdCategories.length}`);
    console.log(`- Supplier: ${supplier.name}`);
    console.log(`- Products: ${createdProducts.length}`);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

createExampleData();