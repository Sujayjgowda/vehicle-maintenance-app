import { z } from "zod";
export declare const createFuelRecordSchema: z.ZodObject<{
    date: z.ZodString;
    liters: z.ZodNumber;
    cost: z.ZodNumber;
    odometerReading: z.ZodNumber;
}, z.core.$strip>;
export declare const updateFuelRecordSchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
    liters: z.ZodOptional<z.ZodNumber>;
    cost: z.ZodOptional<z.ZodNumber>;
    odometerReading: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type CreateFuelRecordInput = z.infer<typeof createFuelRecordSchema>;
export type UpdateFuelRecordInput = z.infer<typeof updateFuelRecordSchema>;
//# sourceMappingURL=fuel.validator.d.ts.map