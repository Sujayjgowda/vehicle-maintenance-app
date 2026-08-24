import { z } from "zod";

const notFutureDate = (val: string) => {
  const d = new Date(val);
  return !isNaN(d.getTime()) && d.getTime() <= Date.now() + 60000;
};

export const createRepairLogSchema = z.object({
  date: z
    .string()
    .datetime({ message: "Valid ISO date required" })
    .refine(notFutureDate, { message: "Repair date cannot be in the future" }),
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
