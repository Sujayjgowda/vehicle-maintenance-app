import { z } from "zod";

const notFutureDate = (val: string) => {
  const d = new Date(val);
  return !isNaN(d.getTime()) && d.getTime() <= Date.now() + 60000;
};

export const createExpenseSchema = z.object({
  category: z.enum(["FUEL", "SERVICE", "REPAIR", "INSURANCE", "TOLL", "PARKING", "OTHER"]),
  amount: z.number().positive("Amount must be positive"),
  date: z
    .string()
    .datetime({ message: "Valid ISO date required" })
    .refine(notFutureDate, { message: "Expense date cannot be in the future" }),
  notes: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
