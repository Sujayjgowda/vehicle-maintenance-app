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

  const record = await prisma.partRecord.create({
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

  // Automatically sync to Expenses if cost is provided
  if (data.cost && data.cost > 0) {
    try {
      await prisma.expense.create({
        data: {
          vehicleId,
          category: "REPAIR",
          amount: data.cost,
          date: new Date(data.installDate),
          notes: `Spare Part: ${data.componentName} (${data.installOdometer.toLocaleString()} KM)`,
          sourceId: record.id,
          sourceType: "PART",
        },
      });
    } catch (e) {
      console.log("Error syncing part expense:", e);
    }
  }

  return record;
}

export async function updatePartRecord(id: string, vehicleId: string, data: UpdatePartRecordInput) {
  const existing = await prisma.partRecord.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Part record not found") as any;
    err.statusCode = 404;
    throw err;
  }

  const updatedCost = data.cost !== undefined ? data.cost : existing.cost;
  const updatedDate = data.installDate ? new Date(data.installDate) : existing.installDate;
  const updatedName = data.componentName ?? existing.componentName;
  const updatedOdometer = data.installOdometer !== undefined ? data.installOdometer : existing.installOdometer;

  const updated = await prisma.partRecord.update({
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

  // Automatically sync update to Expenses
  try {
    const existingExpense = await prisma.expense.findFirst({ where: { sourceId: id } });
    if (updatedCost && updatedCost > 0) {
      const notesText = `Spare Part: ${updatedName} (${updatedOdometer.toLocaleString()} KM)`;
      if (existingExpense) {
        await prisma.expense.update({
          where: { id: existingExpense.id },
          data: {
            amount: updatedCost,
            date: updatedDate,
            notes: notesText,
          },
        });
      } else {
        await prisma.expense.create({
          data: {
            vehicleId,
            category: "REPAIR",
            amount: updatedCost,
            date: updatedDate,
            notes: notesText,
            sourceId: updated.id,
            sourceType: "PART",
          },
        });
      }
    } else if (existingExpense) {
      await prisma.expense.delete({ where: { id: existingExpense.id } });
    }
  } catch (e) {
    console.log("Error updating synced part expense:", e);
  }

  return updated;
}

export async function deletePartRecord(id: string, vehicleId: string) {
  const existing = await prisma.partRecord.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Part record not found") as any;
    err.statusCode = 404;
    throw err;
  }

  // Automatically remove synced Expense
  try {
    await prisma.expense.deleteMany({ where: { sourceId: id } });
  } catch (e) {
    console.log("Error deleting synced part expense:", e);
  }

  return prisma.partRecord.delete({ where: { id } });
}
