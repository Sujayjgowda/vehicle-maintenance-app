import { z } from "zod";

export const createFuelRecordSchema = z.object({
  date: z.string().datetime({ message: "Valid ISO date required" }),
  liters: z.number().positive("Liters must be positive"),
  cost: z.number().positive("Cost must be positive"),
  odometerReading: z.number().int().min(0),
});

export const updateFuelRecordSchema = createFuelRecordSchema.partial();

export type CreateFuelRecordInput = z.infer<typeof createFuelRecordSchema>;
export type UpdateFuelRecordInput = z.infer<typeof updateFuelRecordSchema>;
