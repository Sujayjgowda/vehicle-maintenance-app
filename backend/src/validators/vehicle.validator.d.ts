import { z } from "zod";
export declare const createVehicleSchema: z.ZodObject<{
    make: z.ZodString;
    model: z.ZodString;
    year: z.ZodNumber;
    licensePlate: z.ZodString;
    currentOdometer: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const updateVehicleSchema: z.ZodObject<{
    make: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
    licensePlate: z.ZodOptional<z.ZodString>;
    currentOdometer: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
//# sourceMappingURL=vehicle.validator.d.ts.map