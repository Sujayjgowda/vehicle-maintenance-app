import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { createDocumentSchema, updateDocumentSchema } from "../validators/document.validator";
import * as documentController from "../controllers/document.controller";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(documentController.getAll as any));
router.get("/:id", asyncHandler(documentController.getById as any));
router.post("/", validate(createDocumentSchema), asyncHandler(documentController.create as any));
router.put("/:id", validate(updateDocumentSchema), asyncHandler(documentController.update as any));
router.delete("/:id", asyncHandler(documentController.remove as any));

export default router;
