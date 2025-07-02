# 🔧 INSTRUÇÕES PARA CORRIGIR SUPABASE

## 1. ADICIONAR CAMPO CNPJ NA TABELA COMPANIES

**No Supabase Dashboard:**
1. Acesse: Table Editor > companies  
2. Clique em "Add Column"
3. Configure:
   - **Nome**: `cnpj`
   - **Tipo**: `text` 
   - **Nullable**: ✅ Sim (marque checkbox)
   - **Unique**: ❌ Não
4. Clique em "Save"

## 2. HABILITAR ROW LEVEL SECURITY (RLS)

### Opção A: Via SQL Editor (RECOMENDADO)
1. Acesse: SQL Editor no Supabase Dashboard
2. Cole e execute este SQL:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_execution_items ENABLE ROW LEVEL SECURITY;

-- Verificar se RLS foi habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'users', 'suppliers', 'categories', 'products', 'stock_movements', 'checklist_templates', 'checklist_items', 'checklist_executions', 'checklist_execution_items')
ORDER BY tablename;
```

### Opção B: Via Interface Gráfica
1. Acesse: Authentication > RLS
2. Para cada tabela listada acima:
   - Encontre a tabela na lista
   - Clique no botão "Enable RLS" 
   - Confirme a ação

## 3. VERIFICAÇÃO FINAL

Após fazer as alterações, execute o script de verificação:
```bash
node add_cnpj_and_enable_rls.js
```

**Resultado esperado:**
- ✅ Campo CNPJ deve aparecer sem erro
- ✅ Todas as tabelas devem mostrar RLS habilitado
- ✅ Status deve mostrar "RLS enabled" para todas as tabelas

## 🎯 JUSTIFICATIVA

**CNPJ**: Campo obrigatório para empresas brasileiras, necessário para cadastro completo
**RLS**: Essencial para multi-tenancy seguro, garantindo isolamento de dados por empresa