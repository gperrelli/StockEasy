import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const movementTypeEnum = pgEnum('movement_type', ['entrada', 'saida', 'ajuste']);
export const weekDayEnum = pgEnum('week_day', ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']);
export const checklistTypeEnum = pgEnum('checklist_type', ['abertura', 'fechamento', 'limpeza']);

// Companies table for multi-tenancy
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  cnpj: text("CNPJ"),
  plan: text("plan", { enum: ['basic', 'premium', 'enterprise'] }).notNull().default('basic'),
  isActive: boolean("is_active").notNull().default(true),
  maxUsers: integer("max_users").default(10),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Super Admin table - users who can manage the entire SaaS platform
export const superAdmins = pgTable("super_admins", {
  id: serial("id").primaryKey(),
  supabaseUserId: text("supabase_user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table with enhanced role hierarchy
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"), // Optional for Supabase users
  name: text("name").notNull(),
  companyId: integer("company_id").references(() => companies.id), // Nullable for MASTER users
  role: text("role", { enum: ['MASTER', 'admin', 'gerente', 'operador'] }).notNull().default("operador"),
  supabaseUserId: text("supabase_user_id").unique(),
  isActive: boolean("is_active").notNull().default(true),
  permissions: text("permissions").array(), // Array of specific permissions
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").notNull(), // kg, unidade, litro, etc
  currentStock: integer("current_stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(1),
  maxStock: integer("max_stock"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  categoryId: integer("category_id").references(() => categories.id),
  bestPurchaseDay: weekDayEnum("best_purchase_day"),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Stock movements table
export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  type: movementTypeEnum("type").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id).notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Checklist templates
export const checklistTemplates = pgTable("checklist_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: checklistTypeEnum("type").notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Checklist items
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => checklistTemplates.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"), // Equipamentos, Cozinha, Estoque, etc
  estimatedMinutes: integer("estimated_minutes").default(5),
  order: integer("order").notNull().default(0),
  isRequired: boolean("is_required").notNull().default(true),
});

// Checklist executions
export const checklistExecutions = pgTable("checklist_executions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => checklistTemplates.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  isCompleted: boolean("is_completed").notNull().default(false),
  notes: text("notes"),
});

// Checklist execution items
export const checklistExecutionItems = pgTable("checklist_execution_items", {
  id: serial("id").primaryKey(),
  executionId: integer("execution_id").references(() => checklistExecutions.id).notNull(),
  itemId: integer("item_id").references(() => checklistItems.id).notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

// Schemas for validation
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertSuperAdminSchema = createInsertSchema(superAdmins).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({ id: true, createdAt: true });
export const insertChecklistTemplateSchema = createInsertSchema(checklistTemplates).omit({ id: true, createdAt: true });
export const insertChecklistItemSchema = createInsertSchema(checklistItems).omit({ id: true });
export const insertChecklistExecutionSchema = createInsertSchema(checklistExecutions).omit({ id: true, startedAt: true });
export const insertChecklistExecutionItemSchema = createInsertSchema(checklistExecutionItems).omit({ id: true });

// Types
export type Company = typeof companies.$inferSelect;
export type SuperAdmin = typeof superAdmins.$inferSelect;
export type User = typeof users.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type ChecklistTemplate = typeof checklistTemplates.$inferSelect;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type ChecklistExecution = typeof checklistExecutions.$inferSelect;
export type ChecklistExecutionItem = typeof checklistExecutionItems.$inferSelect;

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertSuperAdmin = z.infer<typeof insertSuperAdminSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type InsertChecklistTemplate = z.infer<typeof insertChecklistTemplateSchema>;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type InsertChecklistExecution = z.infer<typeof insertChecklistExecutionSchema>;
export type InsertChecklistExecutionItem = z.infer<typeof insertChecklistExecutionItemSchema>;

// Extended types for API responses
export type ProductWithDetails = Product & {
  supplier?: Supplier;
  category?: Category;
};

export type StockMovementWithDetails = StockMovement & {
  product: Product;
  user: User;
};

export type ChecklistExecutionWithDetails = ChecklistExecution & {
  template: ChecklistTemplate;
  user: User;
  items: (ChecklistExecutionItem & { item: ChecklistItem })[];
};
