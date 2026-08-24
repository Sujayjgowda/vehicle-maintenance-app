"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceRecordSchema = exports.createServiceRecordSchema = void 0;
const zod_1 = require("zod");
exports.createServiceRecordSchema = zod_1.z.object({
    date: zod_1.z.string().datetime({ message: "Valid ISO date required" }),
    odometer: zod_1.z.number().int().min(0),
    serviceType: zod_1.z.string().min(1, "Service type is required"),
    serviceCenter: zod_1.z.string().optional(),
    cost: zod_1.z.number().min(0),
    notes: zod_1.z.string().optional(),
});
exports.updateServiceRecordSchema = exports.createServiceRecordSchema.partial();
//# sourceMappingURL=service.validator.js.map