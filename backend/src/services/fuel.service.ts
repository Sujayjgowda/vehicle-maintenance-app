import prisma from "../lib/prisma";
import type { CreateFuelRecordInput, UpdateFuelRecordInput } from "../validators/fuel.validator";

/**
 * Calculates average KM/L and cost per KM by comparing against the previous
 * fuel record's odometer reading for the same vehicle.
 */
async function calculateFuelMetrics(vehicleId: string, odometerReading: number, liters: number, cost: number) {
  const previousRecord = await prisma.fuelRecord.findFirst({
    where: { vehicleId, odometerReading: { lt: odometerReading } },
    orderBy: { odometerReading: "desc" },
  });

  let averageKmpl: number | null = null;
  let costPerKm: number | null = null;

  if (previousRecord) {
    const distanceTraveled = odometerReading - previousRecord.odometerReading;
    if (distanceTraveled > 0 && liters > 0) {
      averageKmpl = Math.round((distanceTraveled / liters) * 100) / 100;
      costPerKm = Math.round((cost / distanceTraveled) * 100) / 100;
    }
  }

  return { averageKmpl, costPerKm };
}

export async function getAllFuelRecords(vehicleId: string) {
  return prisma.fuelRecord.findMany({
    where: { vehicleId },
    orderBy: { date: "desc" },
  });
}

export async function getFuelRecordById(id: string, vehicleId: string) {
  const record = await prisma.fuelRecord.findFirst({
    where: { id, vehicleId },
  });

  if (!record) {
    const err = new Error("Fuel record not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return record;
}

export async function createFuelRecord(vehicleId: string, data: CreateFuelRecordInput) {
  const { averageKmpl, costPerKm } = await calculateFuelMetrics(
    vehicleId,
    data.odometerReading,
    data.liters,
    data.cost
  );

  const record = await prisma.fuelRecord.create({
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
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      currentOdometer: {
        set: Math.max(data.odometerReading, 0), // will be overridden below
      },
    },
  });

  // Actually set to the max of current and new
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (vehicle && data.odometerReading > vehicle.currentOdometer) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { currentOdometer: data.odometerReading },
    });
  }

  return record;
}

export async function updateFuelRecord(id: string, vehicleId: string, data: UpdateFuelRecordInput) {
  const existing = await prisma.fuelRecord.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Fuel record not found") as any;
    err.statusCode = 404;
    throw err;
  }

  const updatedOdometer = data.odometerReading ?? existing.odometerReading;
  const updatedLiters = data.liters ?? existing.liters;
  const updatedCost = data.cost ?? existing.cost;

  const { averageKmpl, costPerKm } = await calculateFuelMetrics(
    vehicleId,
    updatedOdometer,
    updatedLiters,
    updatedCost
  );

  const updated = await prisma.fuelRecord.update({
    where: { id },
    data: {
      ...(data.date && { date: new Date(data.date) }),
      ...(data.liters !== undefined && { liters: data.liters }),
      ...(data.cost !== undefined && { cost: data.cost }),
      ...(data.odometerReading !== undefined && { odometerReading: data.odometerReading }),
      averageKmpl,
      costPerKm,
    },
  });

  return updated;
}

export async function deleteFuelRecord(id: string, vehicleId: string) {
  const existing = await prisma.fuelRecord.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Fuel record not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return prisma.fuelRecord.delete({ where: { id } });
}

/** Monthly fuel expenditure summary for a vehicle */
export async function getFuelSummary(vehicleId: string) {
  const records = await prisma.fuelRecord.findMany({
    where: { vehicleId },
    orderBy: { date: "asc" },
  });

  const monthlyTotals: Record<string, { totalCost: number; totalLiters: number; count: number }> = {};

  for (const record of records) {
    const key = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyTotals[key]) {
      monthlyTotals[key] = { totalCost: 0, totalLiters: 0, count: 0 };
    }
    monthlyTotals[key]!.totalCost += record.cost;
    monthlyTotals[key]!.totalLiters += record.liters;
    monthlyTotals[key]!.count += 1;
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
