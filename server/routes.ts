import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, mockAuth } from "./supabaseAuth";
import { authService } from "./authService";
import { db, supabase } from "./db";
import { 
  insertProductSchema,
  insertStockMovementSchema,
  insertSupplierSchema,
  insertCategorySchema,
  companies,
  users,
  insertUserSchema,
  insertChecklistTemplateSchema,
  insertChecklistItemSchema,
  insertChecklistExecutionSchema,
  type Product
} from "@shared/schema";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth endpoints - don't require auth middleware
  app.post('/api/auth/sync-user', async (req, res) => {
    try {
      const { user } = req.body;
      
      if (!user || !user.id || !user.email) {
        return res.status(400).json({ error: 'Invalid user data' });
      }

      console.log('Syncing user:', user.email);
      
      // Simplified sync - check if user exists or create
      let dbUser = await storage.getUserBySupabaseId(user.id);
      
      if (!dbUser) {
        // Create new user from Supabase Auth data
        const userData = {
          email: user.email,
          name: user.name || user.email.split('@')[0],
          role: 'admin' as 'MASTER' | 'admin' | 'gerente' | 'operador',
          supabaseUserId: user.id,
          companyId: null // Will be assigned later
        };
        
        dbUser = await storage.createUser(userData);
      }
      
      res.json({ user: dbUser });
    } catch (error) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // New user signup route - creates user in both Supabase Auth and custom table
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, name, companyId, company, role = 'admin' } = req.body;
      
      console.log('Full request body:', JSON.stringify(req.body, null, 2));
      console.log('Signup attempt:', { email, name, companyId, company, role });
      
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      let finalCompanyId = companyId;

      // Validate role type
      const validRoles = ['MASTER', 'admin', 'gerente', 'operador'];
      const userRole = validRoles.includes(role) ? role : 'admin';

      console.log('Creating complete user with direct Supabase approach:', email);
      
      // Direct Supabase approach to avoid schema cache issues
      const { supabase } = await import('./db');

      // Step 1: Create company if company object is provided
      if (company && !finalCompanyId) {
        console.log('Creating company directly:', company);
        
        const { data: createdCompany, error: companyError } = await supabase
          .from('companies')
          .insert([{
            name: company.name,
            email: company.email,
            cnpj: company.CNPJ || null,
            phone: company.phone || null,
            address: company.address || null
          }])
          .select()
          .single();

        if (companyError) {
          console.error('Error creating company:', companyError);
          return res.status(500).json({ 
            error: 'Failed to create company',
            message: companyError.message 
          });
        }

        finalCompanyId = createdCompany.id;
        console.log('Company created with ID:', finalCompanyId);
      }

      // Step 2: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (authError) {
        return res.status(400).json({ 
          error: 'Auth creation failed',
          message: authError.message 
        });
      }

      if (!authData.user) {
        return res.status(500).json({ 
          error: 'Auth user not created' 
        });
      }

      // Step 3: Create user in custom users table
      const { data: customUser, error: customUserError } = await supabase
        .from('users')
        .insert([{
          email: email,
          name: name,
          supabase_user_id: authData.user.id,
          company_id: finalCompanyId || null,
          role: userRole,
        }])
        .select()
        .single();

      if (customUserError) {
        console.error('Error creating custom user:', customUserError);
        return res.status(500).json({ 
          error: 'Failed to create user',
          message: customUserError.message 
        });
      }

      const result = {
        supabaseUser: authData.user,
        customUser
      };
      
      console.log('User created successfully:', result.customUser.id);
      
      res.json({ 
        message: 'User created successfully',
        user: result.customUser,
        supabaseUser: {
          id: result.supabaseUser.id,
          email: result.supabaseUser.email
        }
      });
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Handle specific error types
      if (error.code === '23503') {
        return res.status(400).json({
          error: 'Invalid reference',
          message: 'Company ID does not exist'
        });
      }
      
      if (error.message?.includes('User already registered')) {
        return res.status(400).json({
          error: 'User already exists',
          message: 'This email is already registered'
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to create user',
        message: error.message || 'Internal server error'
      });
    }
  });

  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserBySupabaseId(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Companies endpoint - no auth required for signup
  app.post('/api/companies', async (req, res) => {
    try {
      const { name, email, CNPJ } = req.body;
      
      console.log('Creating company with Supabase direct:', { name, email, cnpj: CNPJ });
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      // Use Supabase client directly to bypass Drizzle schema issues
      const { supabase } = await import('./db');
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          name,
          email,
          cnpj: CNPJ || null
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      res.json(data);
    } catch (error: any) {
      console.error('Error creating company:', error);
      res.status(500).json({ 
        error: 'Failed to create company',
        message: error.message 
      });
    }
  });

  // Apply auth middleware to all other API routes
  // Force mock auth for development until RLS is properly configured
  const authMiddleware = mockAuth; // process.env.SUPABASE_SERVICE_ROLE_KEY ? requireAuth : mockAuth;

  // Dashboard stats
  app.get("/api/dashboard/stats", authMiddleware, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.companyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Products endpoints
  app.get("/api/products", authMiddleware, async (req, res) => {
    try {
      console.log("Fetching products for companyId:", req.user.companyId);
      const products = await storage.getProductsByCompany(req.user.companyId);
      console.log("Found products:", products.length);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/low-stock", authMiddleware, async (req, res) => {
    try {
      const products = await storage.getLowStockProducts(req.user.companyId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id, req.user.companyId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData, req.user.companyId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduct(id, req.user.companyId);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/products/:id/stock", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const { newStock } = req.body;
      
      if (typeof newStock !== 'number' || newStock < 0) {
        return res.status(400).json({ message: "Invalid stock value" });
      }

      // Get current product to calculate difference
      const product = await storage.getProduct(productId, req.user.companyId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const currentStock = product.currentStock;
      const difference = newStock - currentStock;

      // Update product stock
      await storage.updateProductStock(productId, newStock, req.user.companyId);

      // Create adjustment movement if there's a difference
      if (difference !== 0) {
        const movementData = {
          productId,
          type: 'ajuste' as const,
          quantity: Math.abs(difference),
          unitPrice: null,
          totalPrice: null,
          notes: `Ajuste de estoque: ${currentStock} → ${newStock}`,
          userId: req.user.id,
          companyId: req.user.companyId
        };

        await storage.createStockMovement(movementData);
      }

      res.json({ 
        message: "Stock updated successfully",
        oldStock: currentStock,
        newStock,
        difference
      });
    } catch (error) {
      console.error("Error updating stock:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Stock movements endpoints
  app.get("/api/movements", authMiddleware, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const movements = await storage.getStockMovements(req.user.companyId, limit);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching movements:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movements/product/:productId", async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const movements = await storage.getStockMovementsByProduct(productId, req.user.companyId);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching product movements:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/movements", async (req, res) => {
    try {
      // Clean up empty string values for numeric fields
      const cleanedBody = {
        ...req.body,
        unitPrice: req.body.unitPrice === "" ? null : req.body.unitPrice,
        totalPrice: req.body.totalPrice === "" ? null : req.body.totalPrice,
        userId: req.user.id,
        companyId: req.user.companyId
      };

      const movementData = insertStockMovementSchema.parse(cleanedBody);

      // Create the movement
      const movement = await storage.createStockMovement(movementData);

      // Update product stock
      const product = await storage.getProduct(movementData.productId, req.user.companyId);
      if (product) {
        const newStock = movementData.type === 'entrada' 
          ? product.currentStock + movementData.quantity
          : product.currentStock - movementData.quantity;
        
        await storage.updateProductStock(movementData.productId, Math.max(0, newStock), req.user.companyId);
      }

      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating movement:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Suppliers endpoints
  app.get("/api/suppliers", authMiddleware, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliersByCompany(req.user.companyId);
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, supplierData, req.user.companyId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSupplier(id, req.user.companyId);
      if (!deleted) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Categories endpoints
  app.get("/api/categories", authMiddleware, async (req, res) => {
    try {
      const categories = await storage.getCategoriesByCompany(req.user.companyId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData, req.user.companyId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCategory(id, req.user.companyId);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // WhatsApp list generation
  app.get("/api/whatsapp/shopping-list", async (req, res) => {
    try {
      const lowStockProducts = await storage.getLowStockProducts(req.user.companyId);
      
      // Group products by supplier
      const groupedBySupplier = lowStockProducts.reduce((acc, product) => {
        const supplierName = product.supplier?.name || "Sem Fornecedor";
        if (!acc[supplierName]) {
          acc[supplierName] = [];
        }
        acc[supplierName].push(product);
        return acc;
      }, {} as Record<string, typeof lowStockProducts>);

      // Generate WhatsApp formatted text
      const currentDate = new Date().toLocaleDateString('pt-BR');
      let whatsappText = `🛒 LISTA DE COMPRAS\n📅 Data: ${currentDate}\n\n`;

      Object.entries(groupedBySupplier).forEach(([supplierName, products]) => {
        whatsappText += `🏪 FORNECEDOR: ${supplierName.toUpperCase()}\n`;
        products.forEach(product => {
          const quantity = product.minStock * 3; // 3x minimum stock
          whatsappText += `• ${product.name} - Qtd: ${quantity} (Estoque atual: ${product.currentStock})\n`;
        });
        whatsappText += `\n`;
      });

      whatsappText += `* Quantidades calculadas como 3x o mínimo configurado`;

      res.json({ text: whatsappText, groupedProducts: groupedBySupplier });
    } catch (error) {
      console.error("Error generating WhatsApp list:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send WhatsApp message directly via Business API
  app.post("/api/whatsapp/send-message", async (req, res) => {
    try {
      const { phoneNumber, message, type = "text" } = req.body;

      if (!phoneNumber || !message) {
        return res.status(400).json({ message: "Phone number and message are required" });
      }

      // Validate WhatsApp Business API credentials
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (!accessToken || !phoneNumberId) {
        return res.status(500).json({ 
          message: "WhatsApp Business API not configured",
          error: "Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID"
        });
      }

      // Format phone number (remove any non-numeric characters except +)
      const formattedPhoneNumber = phoneNumber.replace(/[^\d+]/g, '');

      const whatsappApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

      const messageData = {
        messaging_product: "whatsapp",
        to: formattedPhoneNumber,
        type: type,
        text: {
          body: message
        }
      };

      const response = await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("WhatsApp API Error:", responseData);
        return res.status(response.status).json({ 
          message: "Failed to send WhatsApp message",
          error: responseData.error || responseData
        });
      }

      res.json({
        success: true,
        messageId: responseData.messages?.[0]?.id,
        status: "sent"
      });

    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error.message 
      });
    }
  });

  // Send shopping list to multiple suppliers via WhatsApp
  app.post("/api/whatsapp/send-shopping-list", async (req, res) => {
    try {
      const { suppliers } = req.body; // Array of { phoneNumber, supplierName }

      if (!suppliers || !Array.isArray(suppliers) || suppliers.length === 0) {
        return res.status(400).json({ message: "Suppliers array is required" });
      }

      // Get shopping list data
      const lowStockProducts = await storage.getLowStockProducts(req.user.companyId);
      
      // Group products by supplier
      const groupedBySupplier = lowStockProducts.reduce((acc, product) => {
        const supplierName = product.supplier?.name || "Sem Fornecedor";
        if (!acc[supplierName]) {
          acc[supplierName] = [];
        }
        acc[supplierName].push(product);
        return acc;
      }, {} as Record<string, typeof lowStockProducts>);

      const results = [];

      for (const supplier of suppliers) {
        const { phoneNumber, supplierName } = supplier;
        const products = groupedBySupplier[supplierName] || [];

        if (products.length === 0) {
          results.push({
            supplier: supplierName,
            phoneNumber,
            status: "skipped",
            message: "No products with low stock for this supplier"
          });
          continue;
        }

        // Generate personalized message for this supplier
        const currentDate = new Date().toLocaleDateString('pt-BR');
        let supplierMessage = `🛒 PEDIDO DE COMPRAS\n📅 Data: ${currentDate}\n\n`;
        supplierMessage += `Olá! Segue nossa lista de produtos necessários:\n\n`;
        
        products.forEach(product => {
          const quantity = product.minStock * 3; // 3x minimum stock
          supplierMessage += `• ${product.name}\n  Quantidade: ${quantity} ${product.unit}\n  (Estoque atual: ${product.currentStock})\n\n`;
        });

        supplierMessage += `Por favor, envie cotação e prazo de entrega.\n\nObrigado!`;

        // Send message to this supplier
        try {
          const sendResponse = await fetch(`${req.protocol}://${req.get('host')}/api/whatsapp/send-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.authorization || '',
            },
            body: JSON.stringify({
              phoneNumber,
              message: supplierMessage,
              type: "text"
            })
          });

          const sendResult = await sendResponse.json();

          results.push({
            supplier: supplierName,
            phoneNumber,
            status: sendResponse.ok ? "sent" : "failed",
            messageId: sendResult.messageId,
            error: sendResult.error
          });

        } catch (error) {
          results.push({
            supplier: supplierName,
            phoneNumber,
            status: "failed",
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.status === "sent").length;
      const failureCount = results.filter(r => r.status === "failed").length;

      res.json({
        success: successCount > 0,
        results,
        summary: {
          total: suppliers.length,
          sent: successCount,
          failed: failureCount,
          skipped: results.filter(r => r.status === "skipped").length
        }
      });

    } catch (error) {
      console.error("Error sending shopping list via WhatsApp:", error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error.message 
      });
    }
  });

  // Users endpoints
  app.get("/api/users", authMiddleware, async (req, res) => {
    try {
      console.log("API /users called. User:", req.user);
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // MASTER users can see all users, others only see their company users
      console.log("User role:", req.user.role, "Type:", typeof req.user.role);
      const isMaster = req.user.role === 'MASTER';
      console.log("Is MASTER?", isMaster);
      
      const users = isMaster
        ? await storage.getAllUsers()
        : await storage.getUsersByCompany(req.user.companyId);
        
      console.log("Found users:", users.length);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", mockAuth, async (req, res) => {
    try {
      const userData = insertUserSchema.parse({
        ...req.body,
        companyId: req.user.companyId
      });

      // Se não foi fornecido supabaseUserId, criar usuário no Supabase primeiro
      if (!userData.supabaseUserId && userData.email && userData.password) {
        console.log('Creating user in Supabase Auth first...');
        
        // TODO: Implementar criação no Supabase
        // Por enquanto, gerar um ID temporário
        userData.supabaseUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Usar Supabase client direto para contornar RLS
        const { data: user, error } = await supabase
          .from('users')
          .insert({
            email: userData.email,
            name: userData.name,
            role: userData.role,
            company_id: userData.companyId,
            supabase_user_id: userData.supabaseUserId
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        res.status(201).json({
          ...user,
          _note: "Usuário criado localmente. Para funcionar completamente, implemente criação no Supabase Auth."
        });
      } else {
        // Usuário já tem supabaseUserId ou não tem email/senha - usar Supabase client direto
        const { data: user, error } = await supabase
          .from('users')
          .insert({
            email: userData.email,
            name: userData.name,
            role: userData.role,
            company_id: userData.companyId,
            supabase_user_id: userData.supabaseUserId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        res.status(201).json(user);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData, req.user.companyId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id, req.user.companyId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Checklist endpoints
  app.get("/api/checklists/templates", authMiddleware, async (req, res) => {
    try {
      const templates = await storage.getChecklistTemplatesByCompany(req.user.companyId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching checklist templates:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/checklists/templates/:id/items", authMiddleware, async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const items = await storage.getChecklistItems(templateId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching checklist items:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/checklists/executions", mockAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const executions = await storage.getChecklistExecutions(req.user.companyId, limit);
      res.json(executions);
    } catch (error) {
      console.error("Error fetching checklist executions:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/checklists/executions", async (req, res) => {
    try {
      const executionData = insertChecklistExecutionSchema.parse({
        ...req.body,
        userId: req.user.id,
        companyId: req.user.companyId
      });

      const execution = await storage.createChecklistExecution(executionData);

      // Create execution items for all template items
      const items = await storage.getChecklistItems(executionData.templateId);
      for (const item of items) {
        await storage.createChecklistExecutionItem({
          executionId: execution.id,
          itemId: item.id,
          isCompleted: false,
        });
      }

      res.status(201).json(execution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating checklist execution:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/checklists/executions/:id/items/:itemId", async (req, res) => {
    try {
      const executionId = parseInt(req.params.id);
      const itemId = parseInt(req.params.itemId);
      const { isCompleted, notes } = req.body;

      await storage.updateChecklistExecutionItem(executionId, itemId, isCompleted, notes);
      res.status(204).send();
    } catch (error) {
      console.error("Error updating checklist execution item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/checklists/executions/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const execution = await storage.updateChecklistExecution(id, {
        isCompleted: true,
        completedAt: new Date(),
        notes: req.body.notes
      }, req.user.companyId);

      if (!execution) {
        return res.status(404).json({ message: "Checklist execution not found" });
      }

      res.json(execution);
    } catch (error) {
      console.error("Error completing checklist execution:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Checklist Items CRUD endpoints
  app.post("/api/checklists/items", authMiddleware, async (req, res) => {
    try {
      const itemData = insertChecklistItemSchema.parse(req.body);
      const item = await storage.createChecklistItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating checklist item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/checklists/items/:id", authMiddleware, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const itemData = insertChecklistItemSchema.partial().parse(req.body);
      const item = await storage.updateChecklistItem(itemId, itemData);
      
      if (!item) {
        return res.status(404).json({ message: "Checklist item not found" });
      }
      
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating checklist item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/checklists/items/:id", authMiddleware, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const success = await storage.deleteChecklistItem(itemId);
      
      if (!success) {
        return res.status(404).json({ message: "Checklist item not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting checklist item:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // WhatsApp Business API routes
  app.post("/api/whatsapp/send-shopping-list", async (req, res) => {
    try {
      const { supplierId } = req.body;
      const companyId = req.user.companyId;

      if (!supplierId) {
        return res.status(400).json({ message: "Supplier ID is required" });
      }

      // Get supplier information
      const supplier = await storage.getSupplier(supplierId, companyId);
      if (!supplier || !supplier.phone) {
        return res.status(404).json({ message: "Supplier not found or has no phone number" });
      }

      // Get low stock products for this supplier
      const lowStockProducts = await storage.getLowStockProducts(companyId);
      const supplierProducts = lowStockProducts.filter(product => product.supplier?.id === supplierId);

      if (supplierProducts.length === 0) {
        return res.status(200).json({ message: "No low stock products for this supplier" });
      }

      // Generate shopping list message
      let message = `🛒 *Lista de Compras*\n\n`;
      message += `Olá ${supplier.name}!\n\n`;
      message += `Precisamos repor os seguintes produtos:\n\n`;

      supplierProducts.forEach((product, index) => {
        const needed = Math.max(product.maxStock || product.minStock * 2, product.minStock * 2) - product.currentStock;
        message += `${index + 1}. *${product.name}*\n`;
        message += `   Estoque atual: ${product.currentStock} ${product.unit}\n`;
        message += `   Quantidade necessária: ${needed} ${product.unit}\n\n`;
      });

      message += `Por favor, confirme disponibilidade e preços.\n\n`;
      message += `Obrigado!`;

      // Send WhatsApp message if credentials are available
      if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
        await sendWhatsAppMessage(supplier.phone, message);
        res.json({ 
          success: true, 
          message: "Shopping list sent successfully",
          text: message 
        });
      } else {
        // Return the message text for manual sending
        res.json({ 
          success: false, 
          message: "WhatsApp credentials not configured. Message generated for manual sending.",
          text: message,
          phone: supplier.phone
        });
      }
    } catch (error) {
      console.error("Error sending shopping list:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/whatsapp/generate-bulk-list", async (req, res) => {
    try {
      const companyId = req.user.companyId;

      // Get all low stock products
      const lowStockProducts = await storage.getLowStockProducts(companyId);
      
      if (lowStockProducts.length === 0) {
        return res.json({ success: true, suppliers: [] });
      }

      // Group products by supplier
      const supplierGroups = new Map();
      
      for (const product of lowStockProducts) {
        if (product.supplier) {
          const supplierId = product.supplier.id;
          if (!supplierGroups.has(supplierId)) {
            supplierGroups.set(supplierId, {
              supplier: product.supplier,
              products: []
            });
          }
          supplierGroups.get(supplierId).products.push(product);
        }
      }

      const results = [];

      // Generate messages for each supplier
      for (const [supplierId, group] of supplierGroups) {
        const supplier = group.supplier;
        const products = group.products;

        let message = `🛒 *Lista de Compras*\n\n`;
        message += `Olá ${supplier.name}!\n\n`;
        message += `Precisamos repor os seguintes produtos:\n\n`;

        products.forEach((product, index) => {
          const needed = Math.max(product.maxStock || product.minStock * 2, product.minStock * 2) - product.currentStock;
          message += `${index + 1}. *${product.name}*\n`;
          message += `   Estoque atual: ${product.currentStock} ${product.unit}\n`;
          message += `   Quantidade necessária: ${needed} ${product.unit}\n\n`;
        });

        message += `Por favor, confirme disponibilidade e preços.\n\n`;
        message += `Obrigado!`;

        results.push({
          supplier: {
            id: supplier.id,
            name: supplier.name,
            phone: supplier.phone
          },
          text: message,
          productCount: products.length,
          hasPhone: !!supplier.phone
        });
      }

      res.json({ success: true, suppliers: results });
    } catch (error) {
      console.error("Error generating bulk shopping list:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // MASTER user endpoints - no auth required for development
  // Companies management for MASTER users
  app.get("/api/master/companies", mockAuth, async (req: any, res) => {
    try {
      // Use Drizzle ORM to get clean data from database
      const companiesList = await storage.getAllCompanies();
      
      console.log(`✓ Found ${companiesList.length} companies in database`);
      res.json(companiesList);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new company (MASTER only)
  app.post("/api/master/companies", mockAuth, async (req: any, res) => {
    try {
      const { name, email, phone, cnpj, address } = req.body;
      
      console.log(`📝 Creating new company: ${name}`);
      
      const newCompany = await storage.createCompany({
        name,
        email,
        phone,
        cnpj,
        address,
        plan: 'basic',
        isActive: true,
        maxUsers: 10
      });
      
      console.log(`✅ Company created with ID: ${newCompany.id}`);
      res.json(newCompany);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // All users management for MASTER users  
  app.get("/api/master/users", mockAuth, async (req: any, res) => {
    try {
      // Use Drizzle ORM instead of Supabase client directly to get clean data
      const allUsers = await storage.getAllUsers();
      
      // Transform data to match expected format
      const transformedUsers = allUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        isActive: user.isActive,
        createdAt: user.createdAt,
        companyName: null // We'll fetch company names separately if needed
      }));
      
      console.log(`✓ Found ${transformedUsers.length} users in database`);
      res.json(transformedUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Assign company to Admin user (MASTER only)
  app.post("/api/master/users/:userId/assign-company", async (req: any, res) => {
    try {
      
      const targetUserId = parseInt(req.params.userId);
      const { companyId, role } = req.body;
      
      if (role === 'MASTER') {
        return res.status(400).json({ error: 'Only MASTER users can assign MASTER role.' });
      }
      
      const updatedUser = await storage.updateUser(targetUserId, {
        companyId,
        role: role || 'admin'
      }, null); // MASTER can update any user
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error assigning company to user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new user for company (MASTER only)
  app.post("/api/master/users", mockAuth, async (req: any, res) => {
    try {
      const { email, name, password, companyId, role } = req.body;
      
      console.log(`📝 Creating new user: ${name} (${email}) for company ${companyId}`);
      
      // Validate company exists
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      
      // Create user directly in our database (bypassing Supabase Auth for simplicity)
      const newUser = await storage.createUser({
        email,
        name,
        password: password, // In production, this should be hashed
        companyId,
        role: role || 'operador',
        supabaseUserId: `mock-${Date.now()}`, // Mock Supabase ID for development
        isActive: true
      });
      
      console.log(`✅ User created: ${newUser.name} (ID: ${newUser.id})`);
      res.json({
        message: 'User created successfully',
        user: newUser
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ 
        error: 'Failed to create user',
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// WhatsApp Business API helper function
async function sendWhatsAppMessage(phone: string, message: string) {
  if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error("WhatsApp credentials not configured");
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

  const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        body: message
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
  }

  return await response.json();
}
