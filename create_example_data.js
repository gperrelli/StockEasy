/**
 * Script para criar dados de exemplo usando cliente Supabase direto
 * Isso garante que o RLS seja respeitado e os dados sejam criados corretamente
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Environment variables missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createExampleData() {
  try {
    console.log('🚀 Creating example data using Supabase client directly...');
    
    // 1. Create company
    console.log('📝 Creating company: Pizzaria Exemplo');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Pizzaria Exemplo',
        email: 'admin@pizzariaexemplo.com.br',
        phone: '(11) 99999-9999',
        address: 'Rua das Pizzas, 123 - São Paulo, SP'
      })
      .select()
      .single();
      
    if (companyError) {
      console.error('❌ Error creating company:', companyError);
      return;
    }
    
    console.log('✅ Company created:', company);
    
    // 2. Create admin user for the company
    console.log('👤 Creating admin user: João Silva');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        name: 'João Silva',
        email: 'joao@pizzariaexemplo.com.br',
        password: 'senha123', // In production, hash this
        company_id: company.id,
        role: 'admin',
        supabase_user_id: `mock-admin-${Date.now()}`,
        isActive: true
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
        sku: 'PIZZA-MARG-001',
        price: 35.90,
        stock: 0, // Pizza é feita sob demanda
        min_stock: 0,
        unit: 'unidade',
        category_id: createdCategories[0].id,
        supplier_id: supplier.id,
        company_id: company.id
      },
      {
        name: 'Coca-Cola 2L',
        description: 'Refrigerante Coca-Cola 2 litros',
        sku: 'COCA-2L-001',
        price: 8.50,
        stock: 24,
        min_stock: 5,
        unit: 'unidade',
        category_id: createdCategories[1].id,
        supplier_id: supplier.id,
        company_id: company.id
      },
      {
        name: 'Queijo Mussarela',
        description: 'Queijo mussarela fatiado 1kg',
        sku: 'QUEIJO-MUSS-1KG',
        price: 28.90,
        stock: 5,
        min_stock: 2,
        unit: 'kg',
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
    
    console.log('\n🎉 Example data created successfully!');
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