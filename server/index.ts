import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes first (before Vite middleware)
const server = await registerRoutes(app);

// Setup Vite middleware for frontend
await setupVite(app, server);

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
