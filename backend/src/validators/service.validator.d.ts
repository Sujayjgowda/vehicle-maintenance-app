import { z } from "zod";
export declare const createServiceRecordSchema: z.ZodObject<{
    date: z.ZodString;
    odometer: z.ZodNumber;
    serviceType: z.ZodString;
    serviceCenter: z.ZodOptional<z.ZodString>;
    cost: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateServiceRecordSchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
    odometer: z.ZodOptional<z.ZodNumber>;
    serviceType: z.ZodOptional<z.ZodString>;
    serviceCenter: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    cost: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreateServiceRecordInput = z.infer<typeof createServiceRecordSchema>;
export type UpdateServiceRecordInput = z.infer<typeof updateServiceRecordSchema>;
//# sourceMappingURL=service.validator.d.ts.map