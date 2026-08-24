import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { createServiceCenterSchema, updateServiceCenterSchema } from "../validators/serviceCenter.validator";
import * as serviceCenterController from "../controllers/serviceCenter.controller";

const router = Router();

router.get("/", asyncHandler(serviceCenterController.getAll as any));
router.get("/:id", asyncHandler(serviceCenterController.getById as any));
router.post("/", validate(createServiceCenterSchema), asyncHandler(serviceCenterController.create as any));
router.put("/:id", validate(updateServiceCenterSchema), asyncHandler(serviceCenterController.update as any));
router.delete("/:id", asyncHandler(serviceCenterController.remove as any));

export default router;
