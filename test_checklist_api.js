/**
 * Script para testar se os dados de checklist foram criados corretamente
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testChecklistAPI() {
  try {
    console.log('🔍 Verificando dados de checklist no banco...');

    // 1. Verificar templates
    const { data: templates, error: templatesError } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('company_id', 21);

    if (templatesError) {
      console.error('❌ Erro ao buscar templates:', templatesError);
      return;
    }

    console.log(`📋 Templates encontrados: ${templates.length}`);
    templates.forEach(template => {
      console.log(`   - ${template.name} (${template.type})`);
    });

    // 2. Verificar itens
    const { data: items, error: itemsError } = await supabase
      .from('checklist_items')
      .select('*, checklist_templates(name, type)')
      .in('template_id', templates.map(t => t.id));

    if (itemsError) {
      console.error('❌ Erro ao buscar itens:', itemsError);
      return;
    }

    console.log(`📝 Itens encontrados: ${items.length}`);
    
    // Agrupar por template
    const itemsByTemplate = items.reduce((acc, item) => {
      const templateName = item.checklist_templates.name;
      if (!acc[templateName]) acc[templateName] = [];
      acc[templateName].push(item);
      return acc;
    }, {});

    Object.entries(itemsByTemplate).forEach(([templateName, templateItems]) => {
      console.log(`   ${templateName}: ${templateItems.length} itens`);
    });

    // 3. Testar API diretamente
    console.log('\n🔗 Testando API diretamente...');
    
    const response = await fetch('http://localhost:5000/api/checklists/templates', {
      headers: {
        'Authorization': 'Bearer test',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const apiData = await response.json();
      console.log(`✅ API respondeu com ${apiData.length} templates`);
      
      if (apiData.length > 0) {
        console.log('📋 Templates da API:');
        apiData.forEach(template => {
          console.log(`   - ${template.name} (${template.type})`);
        });
      }
    } else {
      console.log(`❌ API respondeu com erro: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testChecklistAPI();