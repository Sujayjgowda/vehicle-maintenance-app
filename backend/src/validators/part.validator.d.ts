import { z } from "zod";
export declare const createPartRecordSchema: z.ZodObject<{
    componentName: z.ZodString;
    installDate: z.ZodString;
    installOdometer: z.ZodNumber;
    replacementIntervalKm: z.ZodOptional<z.ZodNumber>;
    replacementIntervalMonths: z.ZodOptional<z.ZodNumber>;
    nextDueKm: z.ZodOptional<z.ZodNumber>;
    nextDueDate: z.ZodOptional<z.ZodString>;
    cost: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updatePartRecordSchema: z.ZodObject<{
    componentName: z.ZodOptional<z.ZodString>;
    installDate: z.ZodOptional<z.ZodString>;
    installOdometer: z.ZodOptional<z.ZodNumber>;
    replacementIntervalKm: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    replacementIntervalMonths: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    nextDueKm: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    nextDueDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    cost: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreatePartRecordInput = z.infer<typeof createPartRecordSchema>;
export type UpdatePartRecordInput = z.infer<typeof updatePartRecordSchema>;
//# sourceMappingURL=part.validator.d.ts.map