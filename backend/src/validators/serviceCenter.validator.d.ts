import { z } from "zod";
export declare const createServiceCenterSchema: z.ZodObject<{
    name: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
    phone: z.ZodOptional<z.ZodString>;
    isFavorite: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateServiceCenterSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    latitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    longitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isFavorite: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type CreateServiceCenterInput = z.infer<typeof createServiceCenterSchema>;
export type UpdateServiceCenterInput = z.infer<typeof updateServiceCenterSchema>;
//# sourceMappingURL=serviceCenter.validator.d.ts.map