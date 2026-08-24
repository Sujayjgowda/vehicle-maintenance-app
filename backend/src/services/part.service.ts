import prisma from "../lib/prisma";
import type { CreatePartRecordInput, UpdatePartRecordInput } from "../validators/part.validator";

export async function getAllPartRecords(vehicleId: string) {
  return prisma.partRecord.findMany({
    where: { vehicleId },
    orderBy: { installDate: "desc" },
  });
}

export async function getPartRecordById(id: string, vehicleId: string) {
  const record = await prisma.partRecord.findFirst({ where: { id, vehicleId } });
  if (!record) {
    const err = new Error("Part record not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return record;
}

export async function createPartRecord(vehicleId: string, data: CreatePartRecordInput) {
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

  return prisma.partRecord.create({
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

export async function updatePartRecord(id: string, vehicleId: string, data: UpdatePartRecordInput) {
  const existing = await prisma.partRecord.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Part record not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return prisma.partRecord.update({
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

export async function deletePartRecord(id: string, vehicleId: string) {
  const existing = await prisma.partRecord.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Part record not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return prisma.partRecord.delete({ where: { id } });
}
