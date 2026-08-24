"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllServiceRecords = getAllServiceRecords;
exports.getServiceRecordById = getServiceRecordById;
exports.createServiceRecord = createServiceRecord;
exports.updateServiceRecord = updateServiceRecord;
exports.deleteServiceRecord = deleteServiceRecord;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function getAllServiceRecords(vehicleId) {
    return prisma_1.default.serviceRecord.findMany({
        where: { vehicleId },
        orderBy: { date: "desc" },
    });
}
async function getServiceRecordById(id, vehicleId) {
    const record = await prisma_1.default.serviceRecord.findFirst({ where: { id, vehicleId } });
    if (!record) {
        const err = new Error("Service record not found");
        err.statusCode = 404;
        throw err;
    }
    return record;
}
async function createServiceRecord(vehicleId, data) {
    const record = await prisma_1.default.serviceRecord.create({
        data: {
            vehicleId,
            date: new Date(data.date),
            odometer: data.odometer,
            serviceType: data.serviceType,
            serviceCenter: data.serviceCenter,
            cost: data.cost,
            notes: data.notes,
        },
    });
    // Update vehicle odometer if higher
    const vehicle = await prisma_1.default.vehicle.findUnique({ where: { id: vehicleId } });
    if (vehicle && data.odometer > vehicle.currentOdometer) {
        await prisma_1.default.vehicle.update({
            where: { id: vehicleId },
            data: { currentOdometer: data.odometer },
        });
    }
    return record;
}
async function updateServiceRecord(id, vehicleId, data) {
    const existing = await prisma_1.default.serviceRecord.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Service record not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.serviceRecord.update({
        where: { id },
        data: {
            ...(data.date && { date: new Date(data.date) }),
            ...(data.odometer !== undefined && { odometer: data.odometer }),
            ...(data.serviceType !== undefined && { serviceType: data.serviceType }),
            ...(data.serviceCenter !== undefined && { serviceCenter: data.serviceCenter }),
            ...(data.cost !== undefined && { cost: data.cost }),
            ...(data.notes !== undefined && { notes: data.notes }),
        },
    });
}
async function deleteServiceRecord(id, vehicleId) {
    const existing = await prisma_1.default.serviceRecord.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Service record not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.serviceRecord.delete({ where: { id } });
}
//# sourceMappingURL=service.service.js.map