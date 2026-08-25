import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as aiController from "../controllers/ai.controller";

const router = Router();

router.post("/diagnose", asyncHandler(aiController.diagnose as any));
router.post("/parse-receipt", asyncHandler(aiController.parseReceipt as any));
router.get("/vehicles/:vehicleId/predictive-health", asyncHandler(aiController.getPredictiveHealth as any));

export default router;
