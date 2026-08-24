"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExpenseSchema = exports.createExpenseSchema = void 0;
const zod_1 = require("zod");
exports.createExpenseSchema = zod_1.z.object({
    category: zod_1.z.enum(["FUEL", "SERVICE", "REPAIR", "INSURANCE", "TOLL", "PARKING", "OTHER"]),
    amount: zod_1.z.number().positive("Amount must be positive"),
    date: zod_1.z.string().datetime({ message: "Valid ISO date required" }),
    notes: zod_1.z.string().optional(),
});
exports.updateExpenseSchema = exports.createExpenseSchema.partial();
//# sourceMappingURL=expense.validator.js.map