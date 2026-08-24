"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFuelRecordSchema = exports.createFuelRecordSchema = void 0;
const zod_1 = require("zod");
exports.createFuelRecordSchema = zod_1.z.object({
    date: zod_1.z.string().datetime({ message: "Valid ISO date required" }),
    liters: zod_1.z.number().positive("Liters must be positive"),
    cost: zod_1.z.number().positive("Cost must be positive"),
    odometerReading: zod_1.z.number().int().min(0),
});
exports.updateFuelRecordSchema = exports.createFuelRecordSchema.partial();
//# sourceMappingURL=fuel.validator.js.map