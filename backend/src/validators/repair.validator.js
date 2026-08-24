"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRepairLogSchema = exports.createRepairLogSchema = void 0;
const zod_1 = require("zod");
exports.createRepairLogSchema = zod_1.z.object({
    date: zod_1.z.string().datetime({ message: "Valid ISO date required" }),
    odometer: zod_1.z.number().int().min(0),
    description: zod_1.z.string().min(1, "Description is required"),
    cause: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    cost: zod_1.z.number().min(0),
    notes: zod_1.z.string().optional(),
});
exports.updateRepairLogSchema = exports.createRepairLogSchema.partial();
//# sourceMappingURL=repair.validator.js.map