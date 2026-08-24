import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { createExpenseSchema, updateExpenseSchema } from "../validators/expense.validator";
import * as expenseController from "../controllers/expense.controller";

const router = Router({ mergeParams: true });

router.get("/", asyncHandler(expenseController.getAll as any));
router.get("/summary", asyncHandler(expenseController.getSummary as any));
router.get("/:id", asyncHandler(expenseController.getById as any));
router.post("/", validate(createExpenseSchema), asyncHandler(expenseController.create as any));
router.put("/:id", validate(updateExpenseSchema), asyncHandler(expenseController.update as any));
router.delete("/:id", asyncHandler(expenseController.remove as any));

export default router;
