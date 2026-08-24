import { z } from "zod";

export const createServiceCenterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phone: z.string().optional(),
  isFavorite: z.boolean().optional(),
});

export const updateServiceCenterSchema = createServiceCenterSchema.partial();

export type CreateServiceCenterInput = z.infer<typeof createServiceCenterSchema>;
export type UpdateServiceCenterInput = z.infer<typeof updateServiceCenterSchema>;
