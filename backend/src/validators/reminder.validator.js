"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReminderSchema = exports.createReminderSchema = void 0;
const zod_1 = require("zod");
exports.createReminderSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    type: zod_1.z.enum(["SERVICE", "PUC", "INSURANCE", "PART_REPLACEMENT"]),
    dueDate: zod_1.z.string().datetime().optional(),
    dueKm: zod_1.z.number().int().min(0).optional(),
    status: zod_1.z.enum(["PENDING", "COMPLETED", "CANCELLED", "OVERDUE"]).optional(),
});
exports.updateReminderSchema = exports.createReminderSchema.partial();
//# sourceMappingURL=reminder.validator.js.map