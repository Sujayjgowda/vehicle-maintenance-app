"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllServiceCenters = getAllServiceCenters;
exports.getServiceCenterById = getServiceCenterById;
exports.createServiceCenter = createServiceCenter;
exports.updateServiceCenter = updateServiceCenter;
exports.deleteServiceCenter = deleteServiceCenter;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function getAllServiceCenters(userId) {
    return prisma_1.default.serviceCenter.findMany({
        where: { userId },
        orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
    });
}
async function getServiceCenterById(id, userId) {
    const center = await prisma_1.default.serviceCenter.findFirst({ where: { id, userId } });
    if (!center) {
        const err = new Error("Service center not found");
        err.statusCode = 404;
        throw err;
    }
    return center;
}
async function createServiceCenter(userId, data) {
    return prisma_1.default.serviceCenter.create({
        data: {
            userId,
            name: data.name,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            phone: data.phone,
            isFavorite: data.isFavorite ?? false,
        },
    });
}
async function updateServiceCenter(id, userId, data) {
    const existing = await prisma_1.default.serviceCenter.findFirst({ where: { id, userId } });
    if (!existing) {
        const err = new Error("Service center not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.serviceCenter.update({
        where: { id },
        data,
    });
}
async function deleteServiceCenter(id, userId) {
    const existing = await prisma_1.default.serviceCenter.findFirst({ where: { id, userId } });
    if (!existing) {
        const err = new Error("Service center not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.serviceCenter.delete({ where: { id } });
}
//# sourceMappingURL=serviceCenter.service.js.map