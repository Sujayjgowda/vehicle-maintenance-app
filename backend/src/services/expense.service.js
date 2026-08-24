"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllExpenses = getAllExpenses;
exports.getExpenseById = getExpenseById;
exports.createExpense = createExpense;
exports.updateExpense = updateExpense;
exports.deleteExpense = deleteExpense;
exports.getExpenseSummary = getExpenseSummary;
exports.getUserExpenseSummary = getUserExpenseSummary;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function getAllExpenses(vehicleId) {
    return prisma_1.default.expense.findMany({
        where: { vehicleId },
        orderBy: { date: "desc" },
    });
}
async function getExpenseById(id, vehicleId) {
    const expense = await prisma_1.default.expense.findFirst({ where: { id, vehicleId } });
    if (!expense) {
        const err = new Error("Expense not found");
        err.statusCode = 404;
        throw err;
    }
    return expense;
}
async function createExpense(vehicleId, data) {
    return prisma_1.default.expense.create({
        data: {
            vehicleId,
            category: data.category,
            amount: data.amount,
            date: new Date(data.date),
            notes: data.notes,
        },
    });
}
async function updateExpense(id, vehicleId, data) {
    const existing = await prisma_1.default.expense.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Expense not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.expense.update({
        where: { id },
        data: {
            ...(data.category !== undefined && { category: data.category }),
            ...(data.amount !== undefined && { amount: data.amount }),
            ...(data.date !== undefined && { date: new Date(data.date) }),
            ...(data.notes !== undefined && { notes: data.notes }),
        },
    });
}
async function deleteExpense(id, vehicleId) {
    const existing = await prisma_1.default.expense.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Expense not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.expense.delete({ where: { id } });
}
/** Aggregate expense summary grouped by category and month for a vehicle */
async function getExpenseSummary(vehicleId) {
    const expenses = await prisma_1.default.expense.findMany({
        where: { vehicleId },
        orderBy: { date: "asc" },
    });
    const byCategory = {};
    const byMonth = {};
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
async function getUserExpenseSummary(userId) {
    const expenses = await prisma_1.default.expense.findMany({
        where: { vehicle: { userId } },
        include: { vehicle: { select: { make: true, model: true, licensePlate: true } } },
        orderBy: { date: "desc" },
    });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byVehicle = {};
    for (const exp of expenses) {
        const key = exp.vehicleId;
        if (!byVehicle[key]) {
            byVehicle[key] = {
                vehicle: `${exp.vehicle.make} ${exp.vehicle.model} (${exp.vehicle.licensePlate})`,
                total: 0,
            };
        }
        byVehicle[key].total += exp.amount;
    }
    return { total, count: expenses.length, byVehicle: Object.values(byVehicle) };
}
//# sourceMappingURL=expense.service.js.map