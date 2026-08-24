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

  // Automatically sync to Expenses
  try {
    const causeText = data.cause ? ` (Cause: ${data.cause})` : "";
    await prisma.expense.create({
      data: {
        vehicleId,
        category: "REPAIR",
        amount: data.cost,
        date: new Date(data.date),
        notes: `Repair: ${data.description}${causeText} (${data.odometer.toLocaleString()} KM)`,
        sourceId: log.id,
        sourceType: "REPAIR",
      },
    });
  } catch (e) {
    console.log("Error syncing repair expense:", e);
  }

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

  const updatedDate = data.date ? new Date(data.date) : existing.date;
  const updatedCost = data.cost !== undefined ? data.cost : existing.cost;
  const updatedDescription = data.description ?? existing.description;
  const updatedCause = data.cause !== undefined ? data.cause : existing.cause;
  const updatedOdometer = data.odometer !== undefined ? data.odometer : existing.odometer;

  const updated = await prisma.repairLog.update({
    where: { id },
    data: {
      ...(data.date !== undefined && { date: updatedDate }),
      ...(data.odometer !== undefined && { odometer: data.odometer }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.cause !== undefined && { cause: data.cause }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.cost !== undefined && { cost: data.cost }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  // Automatically sync update to Expenses
  try {
    const causeText = updatedCause ? ` (Cause: ${updatedCause})` : "";
    const notesText = `Repair: ${updatedDescription}${causeText} (${updatedOdometer.toLocaleString()} KM)`;
    const existingExpense = await prisma.expense.findFirst({ where: { sourceId: id } });
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
          sourceType: "REPAIR",
        },
      });
    }
  } catch (e) {
    console.log("Error updating synced repair expense:", e);
  }

  return updated;
}

export async function deleteRepairLog(id: string, vehicleId: string) {
  const existing = await prisma.repairLog.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Repair log not found") as any;
    err.statusCode = 404;
    throw err;
  }

  // Automatically remove synced Expense
  try {
    await prisma.expense.deleteMany({ where: { sourceId: id } });
  } catch (e) {
    console.log("Error deleting synced repair expense:", e);
  }

  return prisma.repairLog.delete({ where: { id } });
}
