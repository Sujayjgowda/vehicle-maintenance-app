import { z } from "zod";
export declare const createExpenseSchema: z.ZodObject<{
    category: z.ZodEnum<{
        FUEL: "FUEL";
        INSURANCE: "INSURANCE";
        OTHER: "OTHER";
        PARKING: "PARKING";
        REPAIR: "REPAIR";
        SERVICE: "SERVICE";
        TOLL: "TOLL";
    }>;
    amount: z.ZodNumber;
    date: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateExpenseSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<{
        FUEL: "FUEL";
        INSURANCE: "INSURANCE";
        OTHER: "OTHER";
        PARKING: "PARKING";
        REPAIR: "REPAIR";
        SERVICE: "SERVICE";
        TOLL: "TOLL";
    }>>;
    amount: z.ZodOptional<z.ZodNumber>;
    date: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
//# sourceMappingURL=expense.validator.d.ts.map