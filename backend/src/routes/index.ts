import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import * as reminderController from "../controllers/reminder.controller";
import * as expenseController from "../controllers/expense.controller";

import authRoutes from "./auth.routes";
import vehicleRoutes from "./vehicle.routes";
import fuelRoutes from "./fuel.routes";
import serviceRoutes from "./service.routes";
import documentRoutes from "./document.routes";
import reminderRoutes from "./reminder.routes";
import expenseRoutes from "./expense.routes";
import partRoutes from "./part.routes";
import repairRoutes from "./repair.routes";
import serviceCenterRoutes from "./serviceCenter.routes";

const router = Router();

// ─── Public routes ──────────────────────────────────────────────────────────
router.use("/auth", authRoutes);

// ─── Protected routes (all require JWT) ─────────────────────────────────────
router.use(authenticate as any);

// Vehicles
router.use("/vehicles", vehicleRoutes);

// Nested under /vehicles/:vehicleId
router.use("/vehicles/:vehicleId/fuel", fuelRoutes);
router.use("/vehicles/:vehicleId/services", serviceRoutes);
router.use("/vehicles/:vehicleId/documents", documentRoutes);
router.use("/vehicles/:vehicleId/reminders", reminderRoutes);
router.use("/vehicles/:vehicleId/expenses", expenseRoutes);
router.use("/vehicles/:vehicleId/parts", partRoutes);
router.use("/vehicles/:vehicleId/repairs", repairRoutes);

// User-level routes
router.use("/service-centers", serviceCenterRoutes);

// Cross-vehicle aggregate endpoints
router.get("/reminders/upcoming", asyncHandler(reminderController.getUpcoming as any));
router.get("/expenses/summary", asyncHandler(expenseController.getUserSummary as any));

export default router;
