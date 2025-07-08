import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

console.log('🧪 TESTE COMPLETO DO SUPABASE\n');

// 1. Verificar variáveis de ambiente
console.log('📋 VERIFICANDO VARIÁVEIS DE AMBIENTE:');
console.log(`🌐 URL: ${SUPABASE_URL ? '✅ Definida' : '❌ Não encontrada'}`);
console.log(`🔑 Anon Key: ${SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não encontrada'}`);
console.log(`🔐 Service Key: ${SUPABASE_SERVICE_KEY ? '✅ Definida' : '❌ Não encontrada'}`);
console.log(`🗄️ Database URL: ${DATABASE_URL ? '✅ Definida' : '❌ Não encontrada'}\n`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('❌ Variáveis essenciais não encontradas!');
  process.exit(1);
}

// 2. Teste com Anon Key
console.log('🔑 TESTANDO COM ANON KEY:');
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

try {
  // Teste básico de conectividade
  const { data, error } = await supabaseAnon.from('companies').select('count').limit(1);
  if (error) {
    console.log(`❌ Erro na consulta: ${error.message}`);
  } else {
    console.log('✅ Conectividade básica funcionando');
  }
} catch (err) {
  console.log(`❌ Erro de conexão: ${err.message}`);
}

// 3. Teste com Service Role Key
if (SUPABASE_SERVICE_KEY) {
  console.log('\n🔐 TESTANDO COM SERVICE ROLE KEY:');
  const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // Teste de privilégios administrativos
    const { data, error } = await supabaseService.from('companies').select('*').limit(1);
    if (error) {
      console.log(`❌ Erro com service key: ${error.message}`);
    } else {
      console.log('✅ Service Role Key funcionando');
    }
  } catch (err) {
    console.log(`❌ Erro com service key: ${err.message}`);
  }
}

// 4. Teste de todas as tabelas
console.log('\n🗄️ TESTANDO TODAS AS TABELAS:');
const tables = [
  'companies',
  'users', 
  'products',
  'suppliers',
  'categories',
  'stock_movements',
  'checklist_templates',
  'checklist_items',
  'checklist_executions'
];

for (const table of tables) {
  try {
    const { data, error } = await supabaseAnon.from(table).select('count').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: Acessível`);
    }
  } catch (err) {
    console.log(`❌ ${table}: ${err.message}`);
  }
}

// 5. Teste de URL formatting
console.log('\n🌐 VERIFICANDO FORMATO DA URL:');
try {
  const url = new URL(SUPABASE_URL);
  console.log(`✅ URL válida: ${url.hostname}`);
  console.log(`✅ Protocolo: ${url.protocol}`);
} catch (err) {
  console.log(`❌ URL inválida: ${err.message}`);
}

// 6. Teste de Database URL
if (DATABASE_URL) {
  console.log('\n🗄️ VERIFICANDO DATABASE URL:');
  try {
    const dbUrl = new URL(DATABASE_URL);
    console.log(`✅ Database URL válida`);
    console.log(`✅ Host: ${dbUrl.hostname}`);
    console.log(`✅ Database: ${dbUrl.pathname.slice(1)}`);
  } catch (err) {
    console.log(`❌ Database URL inválida: ${err.message}`);
  }
}

console.log('\n🎉 TESTE COMPLETO FINALIZADO!');
