import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes first (before Vite middleware)
const server = await registerRoutes(app);

// Setup Vite middleware for frontend
await setupVite(app, server);

// Handle port in use error
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`Port ${port} is already in use, trying port ${port + 1}`);
    server.listen(port + 1, () => {
      console.log(`🚀 Server running on port ${port + 1}`);
    });
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
