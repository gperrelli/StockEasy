-- Enable Row Level Security (RLS) for multi-tenant tables
-- Run this in your Supabase SQL editor

-- 1. Enable RLS on all sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_execution_items ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for users table
-- Users can see their own record and company colleagues (based on companyId)
CREATE POLICY "Users can view own company users" ON users
    FOR SELECT
    USING (
        auth.uid()::text = supabase_user_id OR
        company_id IN (
            SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text
        ) OR
        role = 'MASTER'
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (auth.uid()::text = supabase_user_id)
    WITH CHECK (auth.uid()::text = supabase_user_id);

-- Company admins can create/update users in their company
CREATE POLICY "Company admins can manage company users" ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE supabase_user_id = auth.uid()::text 
            AND (role = 'admin' OR role = 'MASTER')
            AND (company_id = users.company_id OR role = 'MASTER')
        )
    );

-- 3. Create policies for companies table
-- Users can see their own company
CREATE POLICY "Users can view own company" ON companies
    FOR SELECT
    USING (
        id IN (
            SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE supabase_user_id = auth.uid()::text 
            AND role = 'MASTER'
        )
    );

-- MASTER users can manage all companies
CREATE POLICY "MASTER can manage companies" ON companies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE supabase_user_id = auth.uid()::text 
            AND role = 'MASTER'
        )
    );

-- 4. Create policies for products table
CREATE POLICY "Users can view company products" ON products
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Company users can manage products" ON products
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM users 
            WHERE supabase_user_id = auth.uid()::text 
            AND role IN ('admin', 'gerente', 'MASTER')
        )
    );

-- 5. Create policies for suppliers table
CREATE POLICY "Users can view company suppliers" ON suppliers
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Company users can manage suppliers" ON suppliers
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM users 
            WHERE supabase_user_id = auth.uid()::text 
            AND role IN ('admin', 'gerente', 'MASTER')
        )
    );

-- 6. Create policies for categories table
CREATE POLICY "Users can view company categories" ON categories
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Company users can manage categories" ON categories
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM users 
            WHERE supabase_user_id = auth.uid()::text 
            AND role IN ('admin', 'gerente', 'MASTER')
        )
    );

-- 7. Create policies for stock_movements table
CREATE POLICY "Users can view company movements" ON stock_movements
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Company users can create movements" ON stock_movements
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM users 
            WHERE supabase_user_id = auth.uid()::text 
            AND role IN ('admin', 'gerente', 'operador', 'MASTER')
        )
    );

-- 8. Create policies for checklist tables
CREATE POLICY "Users can view company checklists" ON checklist_templates
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Company users can manage checklists" ON checklist_templates
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM users 
            WHERE supabase_user_id = auth.uid()::text 
            AND role IN ('admin', 'gerente', 'MASTER')
        )
    );

-- Similar policies for other checklist tables...
CREATE POLICY "Users can view checklist executions" ON checklist_executions
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE supabase_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Company users can manage executions" ON checklist_executions
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM users 
            WHERE supabase_user_id = auth.uid()::text 
            AND role IN ('admin', 'gerente', 'operador', 'MASTER')
        )
    );

-- Function to get current user's company_id
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT company_id 
        FROM users 
        WHERE supabase_user_id = auth.uid()::text
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is MASTER
CREATE OR REPLACE FUNCTION is_master_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM users 
        WHERE supabase_user_id = auth.uid()::text 
        AND role = 'MASTER'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;