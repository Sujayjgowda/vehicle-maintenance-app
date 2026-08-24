"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllVehicles = getAllVehicles;
exports.getVehicleById = getVehicleById;
exports.createVehicle = createVehicle;
exports.updateVehicle = updateVehicle;
exports.deleteVehicle = deleteVehicle;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function getAllVehicles(userId) {
    return prisma_1.default.vehicle.findMany({
        where: { userId },
        include: {
            _count: {
                select: {
                    fuelRecords: true,
                    serviceRecords: true,
                    reminders: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
async function getVehicleById(id, userId) {
    const vehicle = await prisma_1.default.vehicle.findFirst({
        where: { id, userId },
        include: {
            reminders: {
                where: { status: "PENDING" },
                orderBy: { dueDate: "asc" },
                take: 5,
            },
            _count: {
                select: {
                    fuelRecords: true,
                    serviceRecords: true,
                    expenses: true,
                },
            },
        },
    });
    if (!vehicle) {
        const err = new Error("Vehicle not found");
        err.statusCode = 404;
        throw err;
    }
    return vehicle;
}
async function createVehicle(userId, data) {
    return prisma_1.default.vehicle.create({
        data: {
            ...data,
            userId,
        },
    });
}
async function updateVehicle(id, userId, data) {
    // Verify ownership
    const vehicle = await prisma_1.default.vehicle.findFirst({ where: { id, userId } });
    if (!vehicle) {
        const err = new Error("Vehicle not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.vehicle.update({
        where: { id },
        data,
    });
}
async function deleteVehicle(id, userId) {
    const vehicle = await prisma_1.default.vehicle.findFirst({ where: { id, userId } });
    if (!vehicle) {
        const err = new Error("Vehicle not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.vehicle.delete({ where: { id } });
}
//# sourceMappingURL=vehicle.service.js.map