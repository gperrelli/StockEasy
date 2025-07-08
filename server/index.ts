import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
registerRoutes(app);

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
