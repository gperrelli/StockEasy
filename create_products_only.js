import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProducts() {
  try {
    console.log('📦 Creating products for Pizzaria Exemplo...');
    
    // Get company with ID 5 (the main one with admin user)
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', 5)
      .single();

    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', company.id);

    const { data: supplier } = await supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', company.id)
      .single();

    const products = [
      {
        name: 'Pizza Margherita',
        description: 'Pizza com molho de tomate, mussarela e manjericão',
        unit: 'unidade',
        current_stock: 0,
        min_stock: 0,
        cost_price: '35.90',
        category_id: categories[0].id,
        supplier_id: supplier.id,
        company_id: company.id
      },
      {
        name: 'Coca-Cola 2L',
        description: 'Refrigerante Coca-Cola 2 litros',
        unit: 'unidade',
        current_stock: 24,
        min_stock: 5,
        cost_price: '8.50',
        category_id: categories[1].id,
        supplier_id: supplier.id,
        company_id: company.id
      },
      {
        name: 'Queijo Mussarela',
        description: 'Queijo mussarela fatiado 1kg',
        unit: 'kg',
        current_stock: 5,
        min_stock: 2,
        cost_price: '28.90',
        category_id: categories[2].id,
        supplier_id: supplier.id,
        company_id: company.id
      }
    ];

    const { data: createdProducts, error } = await supabase
      .from('products')
      .insert(products)
      .select('*');

    if (error) {
      console.error('❌ Error creating products:', error);
      return;
    }

    console.log('✅ Products created:', createdProducts.length);
    createdProducts.forEach(product => {
      console.log(`  - ${product.name} (Estoque: ${product.current_stock})`);
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

createProducts();