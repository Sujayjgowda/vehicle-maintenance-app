"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllRepairLogs = getAllRepairLogs;
exports.getRepairLogById = getRepairLogById;
exports.createRepairLog = createRepairLog;
exports.updateRepairLog = updateRepairLog;
exports.deleteRepairLog = deleteRepairLog;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function getAllRepairLogs(vehicleId) {
    return prisma_1.default.repairLog.findMany({
        where: { vehicleId },
        orderBy: { date: "desc" },
    });
}
async function getRepairLogById(id, vehicleId) {
    const log = await prisma_1.default.repairLog.findFirst({ where: { id, vehicleId } });
    if (!log) {
        const err = new Error("Repair log not found");
        err.statusCode = 404;
        throw err;
    }
    return log;
}
async function createRepairLog(vehicleId, data) {
    const log = await prisma_1.default.repairLog.create({
        data: {
            vehicleId,
            date: new Date(data.date),
            odometer: data.odometer,
            description: data.description,
            cause: data.cause,
            location: data.location,
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
    return log;
}
async function updateRepairLog(id, vehicleId, data) {
    const existing = await prisma_1.default.repairLog.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Repair log not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.repairLog.update({
        where: { id },
        data: {
            ...(data.date !== undefined && { date: new Date(data.date) }),
            ...(data.odometer !== undefined && { odometer: data.odometer }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.cause !== undefined && { cause: data.cause }),
            ...(data.location !== undefined && { location: data.location }),
            ...(data.cost !== undefined && { cost: data.cost }),
            ...(data.notes !== undefined && { notes: data.notes }),
        },
    });
}
async function deleteRepairLog(id, vehicleId) {
    const existing = await prisma_1.default.repairLog.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Repair log not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.repairLog.delete({ where: { id } });
}
//# sourceMappingURL=repair.service.js.map