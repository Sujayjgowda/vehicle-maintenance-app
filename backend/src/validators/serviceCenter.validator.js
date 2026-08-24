"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceCenterSchema = exports.createServiceCenterSchema = void 0;
const zod_1 = require("zod");
exports.createServiceCenterSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    address: zod_1.z.string().optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    phone: zod_1.z.string().optional(),
    isFavorite: zod_1.z.boolean().optional(),
});
exports.updateServiceCenterSchema = exports.createServiceCenterSchema.partial();
//# sourceMappingURL=serviceCenter.validator.js.map