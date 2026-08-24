import prisma from "../lib/prisma";
import type { CreateServiceRecordInput, UpdateServiceRecordInput } from "../validators/service.validator";

export async function getAllServiceRecords(vehicleId: string) {
  return prisma.serviceRecord.findMany({
    where: { vehicleId },
    orderBy: { date: "desc" },
  });
}

export async function getServiceRecordById(id: string, vehicleId: string) {
  const record = await prisma.serviceRecord.findFirst({ where: { id, vehicleId } });
  if (!record) {
    const err = new Error("Service record not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return record;
}

export async function createServiceRecord(vehicleId: string, data: CreateServiceRecordInput) {
  const record = await prisma.serviceRecord.create({
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
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (vehicle && data.odometer > vehicle.currentOdometer) {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { currentOdometer: data.odometer },
    });
  }

  return record;
}

export async function updateServiceRecord(id: string, vehicleId: string, data: UpdateServiceRecordInput) {
  const existing = await prisma.serviceRecord.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Service record not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return prisma.serviceRecord.update({
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

export async function deleteServiceRecord(id: string, vehicleId: string) {
  const existing = await prisma.serviceRecord.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Service record not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return prisma.serviceRecord.delete({ where: { id } });
}
