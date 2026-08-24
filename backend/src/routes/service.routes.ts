import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { createServiceRecordSchema, updateServiceRecordSchema } from "../validators/service.validator";
import * as serviceController from "../controllers/service.controller";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(serviceController.getAll as any));
router.get("/:id", asyncHandler(serviceController.getById as any));
router.post("/", validate(createServiceRecordSchema), asyncHandler(serviceController.create as any));
router.put("/:id", validate(updateServiceRecordSchema), asyncHandler(serviceController.update as any));
router.delete("/:id", asyncHandler(serviceController.remove as any));

export default router;
