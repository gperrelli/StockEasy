import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProductSchema,
  insertStockMovementSchema,
  insertSupplierSchema,
  insertCategorySchema,
  insertChecklistTemplateSchema,
  insertChecklistItemSchema,
  insertChecklistExecutionSchema,
  type Product
} from "@shared/schema";
import { z } from "zod";

// Middleware to extract user info from session/token
const requireAuth = (req: any, res: any, next: any) => {
  // In a real app, you'd validate JWT/session here
  // For now, we'll mock a user
  req.user = {
    id: 1,
    companyId: 1,
    email: "admin@example.com",
    name: "Admin User",
    role: "admin"
  };
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply auth middleware to all API routes
  app.use("/api", requireAuth);

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.companyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Products endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProductsByCompany(req.user.companyId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/low-stock", async (req, res) => {
    try {
      const products = await storage.getLowStockProducts(req.user.companyId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
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

  // Stock movements endpoints
  app.get("/api/movements", async (req, res) => {
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
      const movementData = insertStockMovementSchema.parse({
        ...req.body,
        userId: req.user.id,
        companyId: req.user.companyId
      });

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
  app.get("/api/suppliers", async (req, res) => {
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
  app.get("/api/categories", async (req, res) => {
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

  // Checklist endpoints
  app.get("/api/checklists/templates", async (req, res) => {
    try {
      const templates = await storage.getChecklistTemplatesByCompany(req.user.companyId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching checklist templates:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/checklists/templates/:id/items", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const items = await storage.getChecklistItems(templateId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching checklist items:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/checklists/executions", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
