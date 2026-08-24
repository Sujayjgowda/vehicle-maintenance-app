"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFuelRecords = getAllFuelRecords;
exports.getFuelRecordById = getFuelRecordById;
exports.createFuelRecord = createFuelRecord;
exports.updateFuelRecord = updateFuelRecord;
exports.deleteFuelRecord = deleteFuelRecord;
exports.getFuelSummary = getFuelSummary;
const prisma_1 = __importDefault(require("../lib/prisma"));
/**
 * Calculates average KM/L and cost per KM by comparing against the previous
 * fuel record's odometer reading for the same vehicle.
 */
async function calculateFuelMetrics(vehicleId, odometerReading, liters, cost) {
    const previousRecord = await prisma_1.default.fuelRecord.findFirst({
        where: { vehicleId, odometerReading: { lt: odometerReading } },
        orderBy: { odometerReading: "desc" },
    });
    let averageKmpl = null;
    let costPerKm = null;
    if (previousRecord) {
        const distanceTraveled = odometerReading - previousRecord.odometerReading;
        if (distanceTraveled > 0 && liters > 0) {
            averageKmpl = Math.round((distanceTraveled / liters) * 100) / 100;
            costPerKm = Math.round((cost / distanceTraveled) * 100) / 100;
        }
    }
    return { averageKmpl, costPerKm };
}
async function getAllFuelRecords(vehicleId) {
    return prisma_1.default.fuelRecord.findMany({
        where: { vehicleId },
        orderBy: { date: "desc" },
    });
}
async function getFuelRecordById(id, vehicleId) {
    const record = await prisma_1.default.fuelRecord.findFirst({
        where: { id, vehicleId },
    });
    if (!record) {
        const err = new Error("Fuel record not found");
        err.statusCode = 404;
        throw err;
    }
    return record;
}
async function createFuelRecord(vehicleId, data) {
    const { averageKmpl, costPerKm } = await calculateFuelMetrics(vehicleId, data.odometerReading, data.liters, data.cost);
    const record = await prisma_1.default.fuelRecord.create({
        data: {
            vehicleId,
            date: new Date(data.date),
            liters: data.liters,
            cost: data.cost,
            odometerReading: data.odometerReading,
            averageKmpl,
            costPerKm,
        },
    });
    // Update vehicle's current odometer if this is the latest reading
    await prisma_1.default.vehicle.update({
        where: { id: vehicleId },
        data: {
            currentOdometer: {
                set: Math.max(data.odometerReading, 0), // will be overridden below
            },
        },
    });
    // Actually set to the max of current and new
    const vehicle = await prisma_1.default.vehicle.findUnique({ where: { id: vehicleId } });
    if (vehicle && data.odometerReading > vehicle.currentOdometer) {
        await prisma_1.default.vehicle.update({
            where: { id: vehicleId },
            data: { currentOdometer: data.odometerReading },
        });
    }
    return record;
}
async function updateFuelRecord(id, vehicleId, data) {
    const existing = await prisma_1.default.fuelRecord.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Fuel record not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.fuelRecord.update({
        where: { id },
        data: {
            ...(data.date && { date: new Date(data.date) }),
            ...(data.liters !== undefined && { liters: data.liters }),
            ...(data.cost !== undefined && { cost: data.cost }),
            ...(data.odometerReading !== undefined && { odometerReading: data.odometerReading }),
        },
    });
}
async function deleteFuelRecord(id, vehicleId) {
    const existing = await prisma_1.default.fuelRecord.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Fuel record not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.fuelRecord.delete({ where: { id } });
}
/** Monthly fuel expenditure summary for a vehicle */
async function getFuelSummary(vehicleId) {
    const records = await prisma_1.default.fuelRecord.findMany({
        where: { vehicleId },
        orderBy: { date: "asc" },
    });
    const monthlyTotals = {};
    for (const record of records) {
        const key = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthlyTotals[key]) {
            monthlyTotals[key] = { totalCost: 0, totalLiters: 0, count: 0 };
        }
        monthlyTotals[key].totalCost += record.cost;
        monthlyTotals[key].totalLiters += record.liters;
        monthlyTotals[key].count += 1;
    }
    const latestAvgKmpl = records.filter((r) => r.averageKmpl !== null).slice(-1)[0]?.averageKmpl ?? null;
    return {
        totalRecords: records.length,
        totalCost: records.reduce((sum, r) => sum + r.cost, 0),
        totalLiters: records.reduce((sum, r) => sum + r.liters, 0),
        latestAvgKmpl,
        monthlyTotals,
    };
}
//# sourceMappingURL=fuel.service.js.map