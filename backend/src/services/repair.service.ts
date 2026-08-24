import prisma from "../lib/prisma";
import type { CreateRepairLogInput, UpdateRepairLogInput } from "../validators/repair.validator";

export async function getAllRepairLogs(vehicleId: string) {
  return prisma.repairLog.findMany({
    where: { vehicleId },
    orderBy: { date: "desc" },
  });
}

export async function getRepairLogById(id: string, vehicleId: string) {
  const log = await prisma.repairLog.findFirst({ where: { id, vehicleId } });
  if (!log) {
    const err = new Error("Repair log not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return log;
}

export async function createRepairLog(vehicleId: string, data: CreateRepairLogInput) {
  const log = await prisma.repairLog.create({
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
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (vehicle && data.odometer > vehicle.currentOdometer) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { currentOdometer: data.odometer },
    });
  }

  return log;
}

export async function updateRepairLog(id: string, vehicleId: string, data: UpdateRepairLogInput) {
  const existing = await prisma.repairLog.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Repair log not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return prisma.repairLog.update({
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

export async function deleteRepairLog(id: string, vehicleId: string) {
  const existing = await prisma.repairLog.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Repair log not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return prisma.repairLog.delete({ where: { id } });
}
