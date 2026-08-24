import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { createReminderSchema, updateReminderSchema } from "../validators/reminder.validator";
import * as reminderController from "../controllers/reminder.controller";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(reminderController.getAll as any));
router.get("/:id", asyncHandler(reminderController.getById as any));
router.post("/", validate(createReminderSchema), asyncHandler(reminderController.create as any));
router.put("/:id", validate(updateReminderSchema), asyncHandler(reminderController.update as any));
router.delete("/:id", asyncHandler(reminderController.remove as any));

export default router;
