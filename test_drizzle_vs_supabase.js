/**
 * Script para comparar Drizzle ORM vs Supabase client
 * para investigar problema na API de checklist
 */

import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { checklistTemplates } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseServiceKey || !databaseUrl) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle({ client: pool, schema: { checklistTemplates } });

async function testComparison() {
  try {
    console.log('🔍 Comparando Supabase client vs Drizzle ORM...');

    // 1. Teste com Supabase client
    console.log('\n📡 Testando com Supabase client:');
    const { data: supabaseResults, error: supabaseError } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('company_id', 21)
      .eq('is_active', true);

    if (supabaseError) {
      console.error('❌ Erro Supabase:', supabaseError);
    } else {
      console.log(`✅ Supabase retornou ${supabaseResults.length} templates`);
      supabaseResults.forEach(t => console.log(`   - ${t.name} (${t.type})`));
    }

    // 2. Teste com Drizzle ORM
    console.log('\n🔧 Testando com Drizzle ORM:');
    try {
      const drizzleResults = await db.select().from(checklistTemplates)
        .where(and(eq(checklistTemplates.companyId, 21), eq(checklistTemplates.isActive, true)));
      
      console.log(`✅ Drizzle retornou ${drizzleResults.length} templates`);
      drizzleResults.forEach(t => console.log(`   - ${t.name} (${t.type})`));
    } catch (drizzleError) {
      console.error('❌ Erro Drizzle:', drizzleError);
    }

    // 3. Verificar RLS
    console.log('\n🔒 Verificando configuração RLS:');
    const { data: rlsInfo, error: rlsError } = await supabase
      .from('checklist_templates')
      .select('*')
      .limit(1);

    if (rlsError) {
      console.log('⚠️ RLS pode estar bloqueando:', rlsError.message);
    } else {
      console.log('✅ RLS permite acesso via Supabase client');
    }

    // 4. Teste direto na API sem cache
    console.log('\n🌐 Testando API diretamente:');
    try {
      const response = await fetch('http://localhost:5000/api/checklists/templates', {
        headers: {
          'Authorization': 'Bearer test',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const apiData = await response.json();
        console.log(`✅ API retornou ${apiData.length} templates`);
        if (apiData.length > 0) {
          apiData.forEach(t => console.log(`   - ${t.name} (${t.type})`));
        }
      } else {
        console.log(`❌ API respondeu com erro: ${response.status}`);
        const errorText = await response.text();
        console.log('Erro:', errorText);
      }
    } catch (apiError) {
      console.error('❌ Erro na API:', apiError.message);
    }

    await pool.end();

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testComparison();