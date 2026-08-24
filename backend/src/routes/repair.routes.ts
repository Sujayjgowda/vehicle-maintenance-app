import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { createRepairLogSchema, updateRepairLogSchema } from "../validators/repair.validator";
import * as repairController from "../controllers/repair.controller";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(repairController.getAll as any));
router.get("/:id", asyncHandler(repairController.getById as any));
router.post("/", validate(createRepairLogSchema), asyncHandler(repairController.create as any));
router.put("/:id", validate(updateRepairLogSchema), asyncHandler(repairController.update as any));
router.delete("/:id", asyncHandler(repairController.remove as any));

export default router;
