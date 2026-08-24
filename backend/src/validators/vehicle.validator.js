"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVehicleSchema = exports.createVehicleSchema = void 0;
const zod_1 = require("zod");
exports.createVehicleSchema = zod_1.z.object({
    make: zod_1.z.string().min(1, "Make is required"),
    model: zod_1.z.string().min(1, "Model is required"),
    year: zod_1.z.number().int().min(1900).max(new Date().getFullYear() + 1),
    licensePlate: zod_1.z.string().min(1, "License plate is required"),
    currentOdometer: zod_1.z.number().int().min(0).optional(),
});
exports.updateVehicleSchema = exports.createVehicleSchema.partial();
//# sourceMappingURL=vehicle.validator.js.map