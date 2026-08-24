import prisma from "../lib/prisma";
import type { CreateExpenseInput, UpdateExpenseInput } from "../validators/expense.validator";

export async function getAllExpenses(vehicleId: string) {
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
