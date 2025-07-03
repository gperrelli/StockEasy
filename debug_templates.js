/**
 * Debug script para investigar templates de checklist
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugTemplates() {
  try {
    console.log('🔍 Debugando templates de checklist...');

    // Verificar todos os templates sem filtro de is_active
    const { data: allTemplates, error: allError } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('company_id', 21);

    if (allError) {
      console.error('❌ Erro ao buscar todos templates:', allError);
      return;
    }

    console.log(`📋 Total de templates para company_id=21: ${allTemplates.length}`);
    allTemplates.forEach(template => {
      console.log(`   - ${template.name} (${template.type}), isActive: ${template.is_active}`);
    });

    // Verificar templates ativos
    const { data: activeTemplates, error: activeError } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('company_id', 21)
      .eq('is_active', true);

    if (activeError) {
      console.error('❌ Erro ao buscar templates ativos:', activeError);
      return;
    }

    console.log(`\n✅ Templates ativos para company_id=21: ${activeTemplates.length}`);
    activeTemplates.forEach(template => {
      console.log(`   - ${template.name} (${template.type})`);
    });

    // Se há templates inativos, ativar eles
    const inactiveTemplates = allTemplates.filter(t => !t.is_active);
    if (inactiveTemplates.length > 0) {
      console.log(`\n🔄 Ativando ${inactiveTemplates.length} templates inativos...`);
      
      const { error: updateError } = await supabase
        .from('checklist_templates')
        .update({ is_active: true })
        .eq('company_id', 21)
        .eq('is_active', false);

      if (updateError) {
        console.error('❌ Erro ao ativar templates:', updateError);
      } else {
        console.log('✅ Templates ativados com sucesso!');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugTemplates();