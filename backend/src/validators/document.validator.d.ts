import { z } from "zod";
export declare const createDocumentSchema: z.ZodObject<{
    docType: z.ZodEnum<{
        INSURANCE: "INSURANCE";
        INVOICE: "INVOICE";
        OTHER: "OTHER";
        PUC: "PUC";
        RC: "RC";
        WARRANTY: "WARRANTY";
    }>;
    title: z.ZodOptional<z.ZodString>;
    fileUrl: z.ZodString;
    expiryDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updateDocumentSchema: z.ZodObject<{
    docType: z.ZodOptional<z.ZodEnum<{
        INSURANCE: "INSURANCE";
        INVOICE: "INVOICE";
        OTHER: "OTHER";
        PUC: "PUC";
        RC: "RC";
        WARRANTY: "WARRANTY";
    }>>;
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fileUrl: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
//# sourceMappingURL=document.validator.d.ts.map