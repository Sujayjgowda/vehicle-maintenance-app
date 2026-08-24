import prisma from "../lib/prisma";
import type { CreateExpenseInput, UpdateExpenseInput } from "../validators/expense.validator";

/**
 * Ensures any historical or unsynced records (Fuel, Service, Repair, Parts)
 * are populated in the Expense table for full analytics and reporting.
 */
export async function syncAllRecordExpenses(vehicleId: string) {
  try {
    // 1. Sync Fuel Records
    const fuelRecords = await prisma.fuelRecord.findMany({ where: { vehicleId } });
    for (const f of fuelRecords) {
      const exists = await prisma.expense.findFirst({ where: { sourceId: f.id } });
      if (!exists) {
        const rateText = f.liters > 0 ? ` @ ₹${(f.cost / f.liters).toFixed(2)}/L` : "";
        await prisma.expense.create({
          data: {
            vehicleId,
            category: "FUEL",
            amount: f.cost,
            date: f.date,
            notes: `Fuel Fill-up: ${f.liters} L${rateText} (Odo: ${f.odometerReading.toLocaleString()} KM)`,
            sourceId: f.id,
            sourceType: "FUEL",
          },
        });
      }
    }

    // 2. Sync Service Records
    const serviceRecords = await prisma.serviceRecord.findMany({ where: { vehicleId } });
    for (const s of serviceRecords) {
      const exists = await prisma.expense.findFirst({ where: { sourceId: s.id } });
      if (!exists) {
        const centerText = s.serviceCenter ? ` @ ${s.serviceCenter}` : "";
        await prisma.expense.create({
          data: {
            vehicleId,
            category: "SERVICE",
            amount: s.cost,
            date: s.date,
            notes: `Service: ${s.serviceType}${centerText} (${s.odometer.toLocaleString()} KM)`,
            sourceId: s.id,
            sourceType: "SERVICE",
          },
        });
      }
    }

    // 3. Sync Repair Logs
    const repairLogs = await prisma.repairLog.findMany({ where: { vehicleId } });
    for (const r of repairLogs) {
      const exists = await prisma.expense.findFirst({ where: { sourceId: r.id } });
      if (!exists) {
        const causeText = r.cause ? ` (Cause: ${r.cause})` : "";
        await prisma.expense.create({
          data: {
            vehicleId,
            category: "REPAIR",
            amount: r.cost,
            date: r.date,
            notes: `Repair: ${r.description}${causeText} (${r.odometer.toLocaleString()} KM)`,
            sourceId: r.id,
            sourceType: "REPAIR",
          },
        });
      }
    }

    // 4. Sync Spare Parts
    const partRecords = await prisma.partRecord.findMany({
      where: { vehicleId, cost: { gt: 0 } },
    });
    for (const p of partRecords) {
      if (p.cost && p.cost > 0) {
        const exists = await prisma.expense.findFirst({ where: { sourceId: p.id } });
        if (!exists) {
          await prisma.expense.create({
            data: {
              vehicleId,
              category: "REPAIR",
              amount: p.cost,
              date: p.installDate,
              notes: `Spare Part: ${p.componentName} (${p.installOdometer.toLocaleString()} KM)`,
              sourceId: p.id,
              sourceType: "PART",
            },
          });
        }
      }
    }
  } catch (e) {
    console.log("Error in syncAllRecordExpenses:", e);
  }
}

export async function getAllExpenses(vehicleId: string) {
  // Backfill any unsynced records
  await syncAllRecordExpenses(vehicleId);

  return prisma.expense.findMany({
    where: { vehicleId },
    orderBy: { date: "desc" },
  });
}

export async function getExpenseById(id: string, vehicleId: string) {
  const expense = await prisma.expense.findFirst({ where: { id, vehicleId } });
  if (!expense) {
    const err = new Error("Expense not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return expense;
}

export async function createExpense(vehicleId: string, data: CreateExpenseInput) {
  return prisma.expense.create({
    data: {
      vehicleId,
      category: data.category as any,
      amount: data.amount,
      date: new Date(data.date),
      notes: data.notes,
      sourceType: "MANUAL",
    },
  });
}

export async function updateExpense(id: string, vehicleId: string, data: UpdateExpenseInput) {
  const existing = await prisma.expense.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Expense not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return prisma.expense.update({
    where: { id },
    data: {
      ...(data.category !== undefined && { category: data.category as any }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });
}

export async function deleteExpense(id: string, vehicleId: string) {
  const existing = await prisma.expense.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Expense not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return prisma.expense.delete({ where: { id } });
}

/** Aggregate expense summary grouped by category and month for a vehicle */
export async function getExpenseSummary(vehicleId: string) {
  // Ensure all records are synced
  await syncAllRecordExpenses(vehicleId);

  const expenses = await prisma.expense.findMany({
    where: { vehicleId },
    orderBy: { date: "asc" },
  });

  const byCategory: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  for (const exp of expenses) {
    // By category
    const cat = exp.category;
    byCategory[cat] = (byCategory[cat] || 0) + exp.amount;

    // By month
    const month = `${exp.date.getFullYear()}-${String(exp.date.getMonth() + 1).padStart(2, "0")}`;
    byMonth[month] = (byMonth[month] || 0) + exp.amount;
  }

  return {
    totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    count: expenses.length,
    byCategory,
    byMonth,
  };
}

/** Summary across all vehicles for a user */
export async function getUserExpenseSummary(userId: string) {
  const vehicles = await prisma.vehicle.findMany({ where: { userId } });
  for (const v of vehicles) {
    await syncAllRecordExpenses(v.id);
  }

  const expenses = await prisma.expense.findMany({
    where: { vehicle: { userId } },
    include: { vehicle: { select: { make: true, model: true, licensePlate: true } } },
    orderBy: { date: "desc" },
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byVehicle: Record<string, { vehicle: string; total: number }> = {};
  for (const exp of expenses) {
    const key = exp.vehicleId;
    if (!byVehicle[key]) {
      byVehicle[key] = {
        vehicle: `${exp.vehicle.make} ${exp.vehicle.model} (${exp.vehicle.licensePlate})`,
        total: 0,
      };
    }
    byVehicle[key]!.total += exp.amount;
  }

  return { total, count: expenses.length, byVehicle: Object.values(byVehicle) };
}
