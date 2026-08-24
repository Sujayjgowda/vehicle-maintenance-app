import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { createVehicleSchema, updateVehicleSchema } from "../validators/vehicle.validator";
import * as vehicleController from "../controllers/vehicle.controller";

const router = Router();

router.get("/", asyncHandler(vehicleController.getAll as any));
router.get("/:id", asyncHandler(vehicleController.getById as any));
router.post("/", validate(createVehicleSchema), asyncHandler(vehicleController.create as any));
router.put("/:id", validate(updateVehicleSchema), asyncHandler(vehicleController.update as any));
router.delete("/:id", asyncHandler(vehicleController.remove as any));

export default router;
