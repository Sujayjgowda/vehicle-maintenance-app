import { z } from "zod";

const notFutureDate = (val: string) => {
  const d = new Date(val);
  return !isNaN(d.getTime()) && d.getTime() <= Date.now() + 60000; // 1 min buffer for clock skew
};

export const createFuelRecordSchema = z.object({
  date: z
    .string()
    .datetime({ message: "Valid ISO date required" })
    .refine(notFutureDate, { message: "Fuel transaction date cannot be in the future" }),
  liters: z.number().positive("Liters must be positive"),
  cost: z.number().positive("Cost must be positive"),
  odometerReading: z.number().int().min(0),
});

export const updateFuelRecordSchema = createFuelRecordSchema.partial();

export type CreateFuelRecordInput = z.infer<typeof createFuelRecordSchema>;
export type UpdateFuelRecordInput = z.infer<typeof updateFuelRecordSchema>;
