import { z } from "zod";

export const createRepairLogSchema = z.object({
  date: z.string().datetime({ message: "Valid ISO date required" }),
  odometer: z.number().int().min(0),
  description: z.string().min(1, "Description is required"),
  cause: z.string().optional(),
  location: z.string().optional(),
  cost: z.number().min(0),
  notes: z.string().optional(),
});

export const updateRepairLogSchema = createRepairLogSchema.partial();

export type CreateRepairLogInput = z.infer<typeof createRepairLogSchema>;
export type UpdateRepairLogInput = z.infer<typeof updateRepairLogSchema>;
