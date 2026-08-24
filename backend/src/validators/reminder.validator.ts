import { z } from "zod";

export const createReminderSchema = z.object({
  title: z.string().optional(),
  type: z.enum(["SERVICE", "PUC", "INSURANCE", "PART_REPLACEMENT"]),
  dueDate: z.string().datetime().optional(),
  dueKm: z.number().int().min(0).optional(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED", "OVERDUE"]).optional(),
});

export const updateReminderSchema = createReminderSchema.partial();

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
