import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { createFuelRecordSchema, updateFuelRecordSchema } from "../validators/fuel.validator";
import * as fuelController from "../controllers/fuel.controller";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(fuelController.getAll as any));
router.get("/summary", asyncHandler(fuelController.getSummary as any));
router.get("/:id", asyncHandler(fuelController.getById as any));
router.post("/", validate(createFuelRecordSchema), asyncHandler(fuelController.create as any));
router.put("/:id", validate(updateFuelRecordSchema), asyncHandler(fuelController.update as any));
router.delete("/:id", asyncHandler(fuelController.remove as any));

export default router;
