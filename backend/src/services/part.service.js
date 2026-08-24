"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPartRecords = getAllPartRecords;
exports.getPartRecordById = getPartRecordById;
exports.createPartRecord = createPartRecord;
exports.updatePartRecord = updatePartRecord;
exports.deletePartRecord = deletePartRecord;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function getAllPartRecords(vehicleId) {
    return prisma_1.default.partRecord.findMany({
        where: { vehicleId },
        orderBy: { installDate: "desc" },
    });
}
async function getPartRecordById(id, vehicleId) {
    const record = await prisma_1.default.partRecord.findFirst({ where: { id, vehicleId } });
    if (!record) {
        const err = new Error("Part record not found");
        err.statusCode = 404;
        throw err;
    }
    return record;
}
async function createPartRecord(vehicleId, data) {
    // Auto-calculate nextDueKm and nextDueDate if intervals are provided
    let nextDueKm = data.nextDueKm;
    let nextDueDate = data.nextDueDate ? new Date(data.nextDueDate) : undefined;
    if (!nextDueKm && data.replacementIntervalKm) {
        nextDueKm = data.installOdometer + data.replacementIntervalKm;
    }
    if (!nextDueDate && data.replacementIntervalMonths) {
        const installDate = new Date(data.installDate);
        nextDueDate = new Date(installDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + data.replacementIntervalMonths);
    }
    return prisma_1.default.partRecord.create({
        data: {
            vehicleId,
            componentName: data.componentName,
            installDate: new Date(data.installDate),
            installOdometer: data.installOdometer,
            replacementIntervalKm: data.replacementIntervalKm,
            replacementIntervalMonths: data.replacementIntervalMonths,
            nextDueKm,
            nextDueDate,
            cost: data.cost,
            notes: data.notes,
        },
    });
}
async function updatePartRecord(id, vehicleId, data) {
    const existing = await prisma_1.default.partRecord.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Part record not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.partRecord.update({
        where: { id },
        data: {
            ...(data.componentName !== undefined && { componentName: data.componentName }),
            ...(data.installDate !== undefined && { installDate: new Date(data.installDate) }),
            ...(data.installOdometer !== undefined && { installOdometer: data.installOdometer }),
            ...(data.replacementIntervalKm !== undefined && { replacementIntervalKm: data.replacementIntervalKm }),
            ...(data.replacementIntervalMonths !== undefined && { replacementIntervalMonths: data.replacementIntervalMonths }),
            ...(data.nextDueKm !== undefined && { nextDueKm: data.nextDueKm }),
            ...(data.nextDueDate !== undefined && { nextDueDate: new Date(data.nextDueDate) }),
            ...(data.cost !== undefined && { cost: data.cost }),
            ...(data.notes !== undefined && { notes: data.notes }),
        },
    });
}
async function deletePartRecord(id, vehicleId) {
    const existing = await prisma_1.default.partRecord.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Part record not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.partRecord.delete({ where: { id } });
}
//# sourceMappingURL=part.service.js.map