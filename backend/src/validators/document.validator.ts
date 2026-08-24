import { z } from "zod";

export const createDocumentSchema = z.object({
  docType: z.enum(["RC", "PUC", "INSURANCE", "INVOICE", "WARRANTY", "OTHER"]),
  title: z.string().optional(),
  fileUrl: z.string().url("Valid URL required"),
  expiryDate: z.string().datetime().optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
