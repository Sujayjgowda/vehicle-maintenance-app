"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const reminderController = __importStar(require("../controllers/reminder.controller"));
const expenseController = __importStar(require("../controllers/expense.controller"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const vehicle_routes_1 = __importDefault(require("./vehicle.routes"));
const fuel_routes_1 = __importDefault(require("./fuel.routes"));
const service_routes_1 = __importDefault(require("./service.routes"));
const document_routes_1 = __importDefault(require("./document.routes"));
const reminder_routes_1 = __importDefault(require("./reminder.routes"));
const expense_routes_1 = __importDefault(require("./expense.routes"));
const part_routes_1 = __importDefault(require("./part.routes"));
const repair_routes_1 = __importDefault(require("./repair.routes"));
const serviceCenter_routes_1 = __importDefault(require("./serviceCenter.routes"));
const router = (0, express_1.Router)();
// ─── Public routes ──────────────────────────────────────────────────────────
router.use("/auth", auth_routes_1.default);
// ─── Protected routes (all require JWT) ─────────────────────────────────────
router.use(auth_1.authenticate);
// Vehicles
router.use("/vehicles", vehicle_routes_1.default);
// Nested under /vehicles/:vehicleId
router.use("/vehicles/:vehicleId/fuel", fuel_routes_1.default);
router.use("/vehicles/:vehicleId/services", service_routes_1.default);
router.use("/vehicles/:vehicleId/documents", document_routes_1.default);
router.use("/vehicles/:vehicleId/reminders", reminder_routes_1.default);
router.use("/vehicles/:vehicleId/expenses", expense_routes_1.default);
router.use("/vehicles/:vehicleId/parts", part_routes_1.default);
router.use("/vehicles/:vehicleId/repairs", repair_routes_1.default);
// User-level routes
router.use("/service-centers", serviceCenter_routes_1.default);
// Cross-vehicle aggregate endpoints
router.get("/reminders/upcoming", (0, errorHandler_1.asyncHandler)(reminderController.getUpcoming));
router.get("/expenses/summary", (0, errorHandler_1.asyncHandler)(expenseController.getUserSummary));
exports.default = router;
//# sourceMappingURL=index.js.map