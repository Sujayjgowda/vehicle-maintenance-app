import { z } from "zod";

const notFutureDate = (val: string) => {
  const d = new Date(val);
  return !isNaN(d.getTime()) && d.getTime() <= Date.now() + 60000;
};

export const createPartRecordSchema = z.object({
  componentName: z.string().min(1, "Component name is required"),
  installDate: z
    .string()
    .datetime({ message: "Valid ISO date required" })
    .refine(notFutureDate, { message: "Installation date cannot be in the future" }),
  installOdometer: z.number().int().min(0),
  replacementIntervalKm: z.number().int().min(0).optional(),
  replacementIntervalMonths: z.number().int().min(0).optional(),
  nextDueKm: z.number().int().min(0).optional(),
  nextDueDate: z.string().datetime().optional(),
  cost: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const updatePartRecordSchema = createPartRecordSchema.partial();

export type CreatePartRecordInput = z.infer<typeof createPartRecordSchema>;
export type UpdatePartRecordInput = z.infer<typeof updatePartRecordSchema>;
