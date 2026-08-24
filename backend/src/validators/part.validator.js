"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePartRecordSchema = exports.createPartRecordSchema = void 0;
const zod_1 = require("zod");
exports.createPartRecordSchema = zod_1.z.object({
    componentName: zod_1.z.string().min(1, "Component name is required"),
    installDate: zod_1.z.string().datetime({ message: "Valid ISO date required" }),
    installOdometer: zod_1.z.number().int().min(0),
    replacementIntervalKm: zod_1.z.number().int().min(0).optional(),
    replacementIntervalMonths: zod_1.z.number().int().min(0).optional(),
    nextDueKm: zod_1.z.number().int().min(0).optional(),
    nextDueDate: zod_1.z.string().datetime().optional(),
    cost: zod_1.z.number().min(0).optional(),
    notes: zod_1.z.string().optional(),
});
exports.updatePartRecordSchema = exports.createPartRecordSchema.partial();
//# sourceMappingURL=part.validator.js.map