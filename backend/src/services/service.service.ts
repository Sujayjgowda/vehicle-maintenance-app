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

  // Automatically sync to Expenses
  try {
    const centerText = data.serviceCenter ? ` @ ${data.serviceCenter}` : "";
    await prisma.expense.create({
      data: {
        vehicleId,
        category: "SERVICE",
        amount: data.cost,
        date: new Date(data.date),
        notes: `Service: ${data.serviceType}${centerText} (${data.odometer.toLocaleString()} KM)`,
        sourceId: record.id,
        sourceType: "SERVICE",
      },
    });
  } catch (e) {
    console.log("Error syncing service expense:", e);
  }

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

  const updatedDate = data.date ? new Date(data.date) : existing.date;
  const updatedCost = data.cost !== undefined ? data.cost : existing.cost;
  const updatedServiceType = data.serviceType ?? existing.serviceType;
  const updatedServiceCenter = data.serviceCenter !== undefined ? data.serviceCenter : existing.serviceCenter;
  const updatedOdometer = data.odometer !== undefined ? data.odometer : existing.odometer;

  const updated = await prisma.serviceRecord.update({
    where: { id },
    data: {
      ...(data.date && { date: updatedDate }),
      ...(data.odometer !== undefined && { odometer: data.odometer }),
      ...(data.serviceType !== undefined && { serviceType: data.serviceType }),
      ...(data.serviceCenter !== undefined && { serviceCenter: data.serviceCenter }),
      ...(data.cost !== undefined && { cost: data.cost }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  // Automatically sync update to Expenses
  try {
    const centerText = updatedServiceCenter ? ` @ ${updatedServiceCenter}` : "";
    const notesText = `Service: ${updatedServiceType}${centerText} (${updatedOdometer.toLocaleString()} KM)`;
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
          category: "SERVICE",
          amount: updatedCost,
          date: updatedDate,
          notes: notesText,
          sourceId: updated.id,
          sourceType: "SERVICE",
        },
      });
    }
  } catch (e) {
    console.log("Error updating synced service expense:", e);
  }

  return updated;
}

export async function deleteServiceRecord(id: string, vehicleId: string) {
  const existing = await prisma.serviceRecord.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Service record not found") as any;
    err.statusCode = 404;
    throw err;
  }

  // Automatically remove synced Expense
  try {
    await prisma.expense.deleteMany({ where: { sourceId: id } });
  } catch (e) {
    console.log("Error deleting synced service expense:", e);
  }

  return prisma.serviceRecord.delete({ where: { id } });
}
