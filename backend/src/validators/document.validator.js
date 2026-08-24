"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDocumentSchema = exports.createDocumentSchema = void 0;
const zod_1 = require("zod");
exports.createDocumentSchema = zod_1.z.object({
    docType: zod_1.z.enum(["RC", "PUC", "INSURANCE", "INVOICE", "WARRANTY", "OTHER"]),
    title: zod_1.z.string().optional(),
    fileUrl: zod_1.z.string().url("Valid URL required"),
    expiryDate: zod_1.z.string().datetime().optional(),
});
exports.updateDocumentSchema = exports.createDocumentSchema.partial();
//# sourceMappingURL=document.validator.js.map