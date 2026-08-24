import { z } from "zod";

export const createServiceRecordSchema = z.object({
  date: z.string().datetime({ message: "Valid ISO date required" }),
  odometer: z.number().int().min(0),
  serviceType: z.string().min(1, "Service type is required"),
  serviceCenter: z.string().optional(),
  cost: z.number().min(0),
  notes: z.string().optional(),
});

export const updateServiceRecordSchema = createServiceRecordSchema.partial();

export type CreateServiceRecordInput = z.infer<typeof createServiceRecordSchema>;
export type UpdateServiceRecordInput = z.infer<typeof updateServiceRecordSchema>;
