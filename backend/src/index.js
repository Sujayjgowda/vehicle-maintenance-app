"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const index_1 = __importDefault(require("./routes/index"));
const errorHandler_1 = require("./middleware/errorHandler");
const prisma_1 = __importDefault(require("./lib/prisma"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Vehicle Maintenance API is running" });
});
// Mount all API routes
app.use("/api", index_1.default);
// Global error handler (must be after routes)
app.use(errorHandler_1.errorHandler);
// Graceful shutdown
async function shutdown() {
    console.log("Shutting down...");
    await prisma_1.default.$disconnect();
    process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map