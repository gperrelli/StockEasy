import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, asc, sql, count } from "drizzle-orm";
import {
  companies,
  users,
  suppliers,
  categories,
  products,
  stockMovements,
  checklistTemplates,
  checklistItems,
  checklistExecutions,
  checklistExecutionItems,
  type Company,
  type User,
  type Supplier,
  type Category,
  type Product,
  type ProductWithDetails,
  type StockMovement,
  type StockMovementWithDetails,
  type ChecklistTemplate,
  type ChecklistItem,
  type ChecklistExecution,
  type ChecklistExecutionWithDetails,
  type InsertCompany,
  type InsertUser,
  type InsertSupplier,
  type InsertCategory,
  type InsertProduct,
  type InsertStockMovement,
  type InsertChecklistTemplate,
  type InsertChecklistItem,
  type InsertChecklistExecution,
  type InsertChecklistExecutionItem,
} from "@shared/schema";

const connection = neon(process.env.DATABASE_URL!);
const db = drizzle(connection);

export interface IStorage {
  // Company methods
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByCompany(companyId: number): Promise<User[]>;

  // Supplier methods
  getSuppliersByCompany(companyId: number): Promise<Supplier[]>;
  getSupplier(id: number, companyId: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>, companyId: number): Promise<Supplier | undefined>;
  deleteSupplier(id: number, companyId: number): Promise<boolean>;

  // Category methods
  getCategoriesByCompany(companyId: number): Promise<Category[]>;
  getCategory(id: number, companyId: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>, companyId: number): Promise<Category | undefined>;
  deleteCategory(id: number, companyId: number): Promise<boolean>;

  // Product methods
  getProductsByCompany(companyId: number): Promise<ProductWithDetails[]>;
  getProduct(id: number, companyId: number): Promise<ProductWithDetails | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>, companyId: number): Promise<Product | undefined>;
  deleteProduct(id: number, companyId: number): Promise<boolean>;
  getLowStockProducts(companyId: number): Promise<ProductWithDetails[]>;
  updateProductStock(productId: number, newStock: number, companyId: number): Promise<void>;

  // Stock movement methods
  getStockMovements(companyId: number, limit?: number): Promise<StockMovementWithDetails[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  getStockMovementsByProduct(productId: number, companyId: number): Promise<StockMovementWithDetails[]>;

  // Checklist methods
  getChecklistTemplatesByCompany(companyId: number): Promise<ChecklistTemplate[]>;
  getChecklistTemplate(id: number, companyId: number): Promise<ChecklistTemplate | undefined>;
  createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate>;
  getChecklistItems(templateId: number): Promise<ChecklistItem[]>;
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  
  getChecklistExecutions(companyId: number, limit?: number): Promise<ChecklistExecutionWithDetails[]>;
  createChecklistExecution(execution: InsertChecklistExecution): Promise<ChecklistExecution>;
  updateChecklistExecution(id: number, execution: Partial<InsertChecklistExecution>, companyId: number): Promise<ChecklistExecution | undefined>;
  createChecklistExecutionItem(item: InsertChecklistExecutionItem): Promise<void>;
  updateChecklistExecutionItem(executionId: number, itemId: number, isCompleted: boolean, notes?: string): Promise<void>;

  // Dashboard stats
  getDashboardStats(companyId: number): Promise<{
    totalProducts: number;
    lowStockCount: number;
    todayMovements: number;
    suppliersCount: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Company methods
  async getCompany(id: number): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result[0];
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const result = await db.insert(companies).values(company).returning();
    return result[0];
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserBySupabaseId(supabaseUserId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.supabaseUserId, supabaseUserId)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getUsersByCompany(companyId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.companyId, companyId));
  }

  // Supplier methods
  async getSuppliersByCompany(companyId: number): Promise<Supplier[]> {
    return await db.select().from(suppliers).where(eq(suppliers.companyId, companyId)).orderBy(asc(suppliers.name));
  }

  async getSupplier(id: number, companyId: number): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values(supplier).returning();
    return result[0];
  }

  async updateSupplier(id: number, supplier: Partial<InsertSupplier>, companyId: number): Promise<Supplier | undefined> {
    const result = await db.update(suppliers)
      .set(supplier)
      .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteSupplier(id: number, companyId: number): Promise<boolean> {
    const result = await db.delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)));
    return result.rowCount > 0;
  }

  // Category methods
  async getCategoriesByCompany(companyId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.companyId, companyId)).orderBy(asc(categories.name));
  }

  async getCategory(id: number, companyId: number): Promise<Category | undefined> {
    const result = await db.select().from(categories)
      .where(and(eq(categories.id, id), eq(categories.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: number, category: Partial<InsertCategory>, companyId: number): Promise<Category | undefined> {
    const result = await db.update(categories)
      .set(category)
      .where(and(eq(categories.id, id), eq(categories.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteCategory(id: number, companyId: number): Promise<boolean> {
    const result = await db.delete(categories)
      .where(and(eq(categories.id, id), eq(categories.companyId, companyId)));
    return result.rowCount > 0;
  }

  // Product methods
  async getProductsByCompany(companyId: number): Promise<ProductWithDetails[]> {
    const result = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      unit: products.unit,
      currentStock: products.currentStock,
      minStock: products.minStock,
      maxStock: products.maxStock,
      costPrice: products.costPrice,
      supplierId: products.supplierId,
      categoryId: products.categoryId,
      bestPurchaseDay: products.bestPurchaseDay,
      companyId: products.companyId,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      supplier: suppliers,
      category: categories,
    })
    .from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.companyId, companyId), eq(products.isActive, true)))
    .orderBy(asc(products.name));

    return result.map(row => ({
      ...row,
      supplier: row.supplier || undefined,
      category: row.category || undefined,
    }));
  }

  async getProduct(id: number, companyId: number): Promise<ProductWithDetails | undefined> {
    const result = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      unit: products.unit,
      currentStock: products.currentStock,
      minStock: products.minStock,
      maxStock: products.maxStock,
      costPrice: products.costPrice,
      supplierId: products.supplierId,
      categoryId: products.categoryId,
      bestPurchaseDay: products.bestPurchaseDay,
      companyId: products.companyId,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      supplier: suppliers,
      category: categories,
    })
    .from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.id, id), eq(products.companyId, companyId)))
    .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row,
      supplier: row.supplier || undefined,
      category: row.category || undefined,
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: number, product: Partial<InsertProduct>, companyId: number): Promise<Product | undefined> {
    const result = await db.update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteProduct(id: number, companyId: number): Promise<boolean> {
    const result = await db.update(products)
      .set({ isActive: false })
      .where(and(eq(products.id, id), eq(products.companyId, companyId)));
    return result.rowCount > 0;
  }

  async getLowStockProducts(companyId: number): Promise<ProductWithDetails[]> {
    const result = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      unit: products.unit,
      currentStock: products.currentStock,
      minStock: products.minStock,
      maxStock: products.maxStock,
      costPrice: products.costPrice,
      supplierId: products.supplierId,
      categoryId: products.categoryId,
      bestPurchaseDay: products.bestPurchaseDay,
      companyId: products.companyId,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      supplier: suppliers,
      category: categories,
    })
    .from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(
      eq(products.companyId, companyId),
      eq(products.isActive, true),
      sql`${products.currentStock} <= ${products.minStock}`
    ))
    .orderBy(asc(products.currentStock));

    return result.map(row => ({
      ...row,
      supplier: row.supplier || undefined,
      category: row.category || undefined,
    }));
  }

  async updateProductStock(productId: number, newStock: number, companyId: number): Promise<void> {
    await db.update(products)
      .set({ currentStock: newStock, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.companyId, companyId)));
  }

  // Stock movement methods
  async getStockMovements(companyId: number, limit = 50): Promise<StockMovementWithDetails[]> {
    const result = await db.select({
      id: stockMovements.id,
      productId: stockMovements.productId,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      unitPrice: stockMovements.unitPrice,
      totalPrice: stockMovements.totalPrice,
      notes: stockMovements.notes,
      userId: stockMovements.userId,
      companyId: stockMovements.companyId,
      createdAt: stockMovements.createdAt,
      product: products,
      user: users,
    })
    .from(stockMovements)
    .innerJoin(products, eq(stockMovements.productId, products.id))
    .innerJoin(users, eq(stockMovements.userId, users.id))
    .where(eq(stockMovements.companyId, companyId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);

    return result;
  }

  async createStockMovement(movement: InsertStockMovement): Promise<StockMovement> {
    const result = await db.insert(stockMovements).values(movement).returning();
    return result[0];
  }

  async getStockMovementsByProduct(productId: number, companyId: number): Promise<StockMovementWithDetails[]> {
    const result = await db.select({
      id: stockMovements.id,
      productId: stockMovements.productId,
      type: stockMovements.type,
      quantity: stockMovements.quantity,
      unitPrice: stockMovements.unitPrice,
      totalPrice: stockMovements.totalPrice,
      notes: stockMovements.notes,
      userId: stockMovements.userId,
      companyId: stockMovements.companyId,
      createdAt: stockMovements.createdAt,
      product: products,
      user: users,
    })
    .from(stockMovements)
    .innerJoin(products, eq(stockMovements.productId, products.id))
    .innerJoin(users, eq(stockMovements.userId, users.id))
    .where(and(eq(stockMovements.productId, productId), eq(stockMovements.companyId, companyId)))
    .orderBy(desc(stockMovements.createdAt));

    return result;
  }

  // Checklist methods
  async getChecklistTemplatesByCompany(companyId: number): Promise<ChecklistTemplate[]> {
    return await db.select().from(checklistTemplates)
      .where(and(eq(checklistTemplates.companyId, companyId), eq(checklistTemplates.isActive, true)))
      .orderBy(asc(checklistTemplates.name));
  }

  async getChecklistTemplate(id: number, companyId: number): Promise<ChecklistTemplate | undefined> {
    const result = await db.select().from(checklistTemplates)
      .where(and(eq(checklistTemplates.id, id), eq(checklistTemplates.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createChecklistTemplate(template: InsertChecklistTemplate): Promise<ChecklistTemplate> {
    const result = await db.insert(checklistTemplates).values(template).returning();
    return result[0];
  }

  async getChecklistItems(templateId: number): Promise<ChecklistItem[]> {
    return await db.select().from(checklistItems)
      .where(eq(checklistItems.templateId, templateId))
      .orderBy(asc(checklistItems.order));
  }

  async createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem> {
    const result = await db.insert(checklistItems).values(item).returning();
    return result[0];
  }

  async getChecklistExecutions(companyId: number, limit = 20): Promise<ChecklistExecutionWithDetails[]> {
    const executions = await db.select({
      id: checklistExecutions.id,
      templateId: checklistExecutions.templateId,
      userId: checklistExecutions.userId,
      companyId: checklistExecutions.companyId,
      startedAt: checklistExecutions.startedAt,
      completedAt: checklistExecutions.completedAt,
      isCompleted: checklistExecutions.isCompleted,
      notes: checklistExecutions.notes,
      template: checklistTemplates,
      user: users,
    })
    .from(checklistExecutions)
    .innerJoin(checklistTemplates, eq(checklistExecutions.templateId, checklistTemplates.id))
    .innerJoin(users, eq(checklistExecutions.userId, users.id))
    .where(eq(checklistExecutions.companyId, companyId))
    .orderBy(desc(checklistExecutions.startedAt))
    .limit(limit);

    // Get items for each execution
    const executionsWithItems = await Promise.all(
      executions.map(async (execution) => {
        const items = await db.select({
          id: checklistExecutionItems.id,
          executionId: checklistExecutionItems.executionId,
          itemId: checklistExecutionItems.itemId,
          isCompleted: checklistExecutionItems.isCompleted,
          completedAt: checklistExecutionItems.completedAt,
          notes: checklistExecutionItems.notes,
          item: checklistItems,
        })
        .from(checklistExecutionItems)
        .innerJoin(checklistItems, eq(checklistExecutionItems.itemId, checklistItems.id))
        .where(eq(checklistExecutionItems.executionId, execution.id))
        .orderBy(asc(checklistItems.order));

        return {
          ...execution,
          items,
        };
      })
    );

    return executionsWithItems;
  }

  async createChecklistExecution(execution: InsertChecklistExecution): Promise<ChecklistExecution> {
    const result = await db.insert(checklistExecutions).values(execution).returning();
    return result[0];
  }

  async updateChecklistExecution(id: number, execution: Partial<InsertChecklistExecution>, companyId: number): Promise<ChecklistExecution | undefined> {
    const result = await db.update(checklistExecutions)
      .set(execution)
      .where(and(eq(checklistExecutions.id, id), eq(checklistExecutions.companyId, companyId)))
      .returning();
    return result[0];
  }

  async createChecklistExecutionItem(item: InsertChecklistExecutionItem): Promise<void> {
    await db.insert(checklistExecutionItems).values(item);
  }

  async updateChecklistExecutionItem(executionId: number, itemId: number, isCompleted: boolean, notes?: string): Promise<void> {
    await db.update(checklistExecutionItems)
      .set({
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        notes,
      })
      .where(and(
        eq(checklistExecutionItems.executionId, executionId),
        eq(checklistExecutionItems.itemId, itemId)
      ));
  }

  // Dashboard stats
  async getDashboardStats(companyId: number): Promise<{
    totalProducts: number;
    lowStockCount: number;
    todayMovements: number;
    suppliersCount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalProducts, lowStockCount, todayMovements, suppliersCount] = await Promise.all([
      db.select({ count: count() }).from(products)
        .where(and(eq(products.companyId, companyId), eq(products.isActive, true))),
      db.select({ count: count() }).from(products)
        .where(and(
          eq(products.companyId, companyId),
          eq(products.isActive, true),
          sql`${products.currentStock} <= ${products.minStock}`
        )),
      db.select({ count: count() }).from(stockMovements)
        .where(and(eq(stockMovements.companyId, companyId), sql`${stockMovements.createdAt} >= ${today}`)),
      db.select({ count: count() }).from(suppliers)
        .where(eq(suppliers.companyId, companyId)),
    ]);

    return {
      totalProducts: totalProducts[0].count,
      lowStockCount: lowStockCount[0].count,
      todayMovements: todayMovements[0].count,
      suppliersCount: suppliersCount[0].count,
    };
  }
}

export const storage = new DatabaseStorage();
