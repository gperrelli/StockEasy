import { createClient } from '@supabase/supabase-js';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Supabase client configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL must be set");
}

// Create Supabase client for server-side operations
export const supabase = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY!);

console.log('✓ Supabase client configured:', supabaseUrl);

// Configure database connection
neonConfig.webSocketConstructor = ws;

// Priority: Supabase connection string > Neon connection
const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Database connection string is required (SUPABASE_DATABASE_URL or DATABASE_URL)");
}

console.log('Database connection:', connectionString.includes('supabase.co') ? 'Supabase' : 'Neon');

const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });
