import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { createPartRecordSchema, updatePartRecordSchema } from "../validators/part.validator";
import * as partController from "../controllers/part.controller";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(partController.getAll as any));
router.get("/:id", asyncHandler(partController.getById as any));
router.post("/", validate(createPartRecordSchema), asyncHandler(partController.create as any));
router.put("/:id", validate(updatePartRecordSchema), asyncHandler(partController.update as any));
router.delete("/:id", asyncHandler(partController.remove as any));

export default router;
