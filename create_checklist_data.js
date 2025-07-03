/**
 * Script para criar dados de exemplo de checklist
 * usando cliente Supabase direto respeitando RLS
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createChecklistData() {
  try {
    console.log('🔧 Criando dados de exemplo para checklists...');

    // 1. Criar templates de checklist
    const templates = [
      {
        name: 'Abertura',
        type: 'abertura',
        company_id: 21,
      },
      {
        name: 'Fechamento',
        type: 'fechamento', 
        company_id: 21,
      },
      {
        name: 'Limpeza',
        type: 'limpeza',
        company_id: 21,
      }
    ];

    const { data: createdTemplates, error: templateError } = await supabase
      .from('checklist_templates')
      .insert(templates)
      .select();

    if (templateError) {
      console.error('❌ Erro ao criar templates:', templateError);
      return;
    }

    console.log(`✅ Criados ${createdTemplates.length} templates de checklist`);

    // 2. Criar itens para cada template
    const checklistItems = [];

    // Items para Abertura
    const aberturaTemplate = createdTemplates.find(t => t.type === 'abertura');
    if (aberturaTemplate) {
      checklistItems.push(
        { 
          template_id: aberturaTemplate.id, 
          title: 'Verificar equipamentos de cozinha',
          description: 'Conferir se todos os equipamentos estão funcionando',
          category: 'Equipamentos',
          order: 1,
        },
        { 
          template_id: aberturaTemplate.id, 
          title: 'Ligar sistema de som',
          description: 'Ligar som ambiente e testar volume',
          category: 'Ambiente',
          order: 2,
        },
        { 
          template_id: aberturaTemplate.id, 
          title: 'Verificar estoque de bebidas',
          description: 'Conferir níveis de bebidas para o dia',
          category: 'Estoque',
          order: 3,
        },
        { 
          template_id: aberturaTemplate.id, 
          title: 'Conferir limpeza das mesas',
          description: 'Verificar se todas as mesas estão limpas',
          category: 'Limpeza',
          order: 4,
        },
        { 
          template_id: aberturaTemplate.id, 
          title: 'Verificar sistema de pagamento',
          description: 'Testar máquinas de cartão e sistema',
          category: 'Equipamentos',
          order: 5,
        }
      );
    }

    // Items para Fechamento
    const fechamentoTemplate = createdTemplates.find(t => t.type === 'fechamento');
    if (fechamentoTemplate) {
      checklistItems.push(
        { 
          template_id: fechamentoTemplate.id, 
          title: 'Fechar caixa e conferir vendas',
          description: 'Consolidar vendas do dia e fechar caixa',
          category: 'Financeiro',
          order: 1,
        },
        { 
          template_id: fechamentoTemplate.id, 
          title: 'Desligar equipamentos da cozinha',
          description: 'Desligar fogão, fritadeira e outros equipamentos',
          category: 'Equipamentos',
          order: 2,
        },
        { 
          template_id: fechamentoTemplate.id, 
          title: 'Conferir estoque para próximo dia',
          description: 'Verificar se há produtos suficientes',
          category: 'Estoque',
          order: 3,
        },
        { 
          template_id: fechamentoTemplate.id, 
          title: 'Trancar portas e janelas',
          description: 'Verificar se tudo está trancado',
          category: 'Segurança',
          order: 4,
        },
        { 
          template_id: fechamentoTemplate.id, 
          title: 'Ativar sistema de alarme',
          description: 'Ativar alarme e conferir funcionamento',
          category: 'Segurança',
          order: 5,
        }
      );
    }

    // Items para Limpeza
    const limpezaTemplate = createdTemplates.find(t => t.type === 'limpeza');
    if (limpezaTemplate) {
      checklistItems.push(
        { 
          template_id: limpezaTemplate.id, 
          title: 'Limpar e sanitizar todas as mesas',
          description: 'Sanitizar mesas com produto adequado',
          category: 'Limpeza',
          order: 1,
        },
        { 
          template_id: limpezaTemplate.id, 
          title: 'Lavar louças e utensílios',
          description: 'Lavar e secar todos os utensílios',
          category: 'Cozinha',
          order: 2,
        },
        { 
          template_id: limpezaTemplate.id, 
          title: 'Limpar banheiros e repor suprimentos',
          description: 'Limpar e repor papel higiênico e sabonete',
          category: 'Banheiros',
          order: 3,
        },
        { 
          template_id: limpezaTemplate.id, 
          title: 'Varrer e passar pano no chão',
          description: 'Limpar todo o piso do estabelecimento',
          category: 'Limpeza',
          order: 4,
        },
        { 
          template_id: limpezaTemplate.id, 
          title: 'Esvaziar lixo e trocar sacos',
          description: 'Recolher lixo e colocar sacos novos',
          category: 'Limpeza',
          order: 5,
        }
      );
    }

    // Inserir todos os itens
    if (checklistItems.length > 0) {
      const { data: createdItems, error: itemsError } = await supabase
        .from('checklist_items')
        .insert(checklistItems)
        .select();

      if (itemsError) {
        console.error('❌ Erro ao criar items:', itemsError);
        return;
      }

      console.log(`✅ Criados ${createdItems.length} itens de checklist`);
    }

    // 3. Verificar dados criados
    const { data: finalTemplates } = await supabase
      .from('checklist_templates')
      .select('*, checklist_items(*)')
      .eq('company_id', 21);

    console.log('\n🎉 Dados de exemplo criados com sucesso!');
    console.log(`📋 Templates: ${finalTemplates.length}`);
    finalTemplates.forEach(template => {
      console.log(`   - ${template.name}: ${template.checklist_items.length} itens`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createChecklistData();