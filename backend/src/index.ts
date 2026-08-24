import express from "express";
import cors from "cors";
import "dotenv/config";
import routes from "./routes/index";
import { errorHandler } from "./middleware/errorHandler";
import prisma from "./lib/prisma";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Vehicle Maintenance API is running" });
});

// Mount all API routes
app.use("/api", routes);

// Global error handler (must be after routes)
app.use(errorHandler as any);

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down...");
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

app.listen(PORT as number, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
