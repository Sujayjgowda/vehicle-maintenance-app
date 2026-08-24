import { z } from "zod";

export const createExpenseSchema = z.object({
  category: z.enum(["FUEL", "SERVICE", "REPAIR", "INSURANCE", "TOLL", "PARKING", "OTHER"]),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().datetime({ message: "Valid ISO date required" }),
  notes: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
