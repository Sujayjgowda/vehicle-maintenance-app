import { z } from "zod";
export declare const createRepairLogSchema: z.ZodObject<{
    date: z.ZodString;
    odometer: z.ZodNumber;
    description: z.ZodString;
    cause: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    cost: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateRepairLogSchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
    odometer: z.ZodOptional<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    cause: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    cost: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreateRepairLogInput = z.infer<typeof createRepairLogSchema>;
export type UpdateRepairLogInput = z.infer<typeof updateRepairLogSchema>;
//# sourceMappingURL=repair.validator.d.ts.map