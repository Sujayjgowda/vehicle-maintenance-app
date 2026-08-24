import { z } from "zod";
export declare const createReminderSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<{
        INSURANCE: "INSURANCE";
        PART_REPLACEMENT: "PART_REPLACEMENT";
        PUC: "PUC";
        SERVICE: "SERVICE";
    }>;
    dueDate: z.ZodOptional<z.ZodString>;
    dueKm: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        COMPLETED: "COMPLETED";
        OVERDUE: "OVERDUE";
        PENDING: "PENDING";
    }>>;
}, z.core.$strip>;
export declare const updateReminderSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodEnum<{
        INSURANCE: "INSURANCE";
        PART_REPLACEMENT: "PART_REPLACEMENT";
        PUC: "PUC";
        SERVICE: "SERVICE";
    }>>;
    dueDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dueKm: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        CANCELLED: "CANCELLED";
        COMPLETED: "COMPLETED";
        OVERDUE: "OVERDUE";
        PENDING: "PENDING";
    }>>>;
}, z.core.$strip>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
//# sourceMappingURL=reminder.validator.d.ts.map