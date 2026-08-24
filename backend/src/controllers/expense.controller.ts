import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as expenseService from "../services/expense.service";

export async function getAll(req: AuthRequest, res: Response) {
  const expenses = await expenseService.getAllExpenses(req.params.vehicleId!);
  res.json(expenses);
}

export async function getById(req: AuthRequest, res: Response) {
  const expense = await expenseService.getExpenseById(req.params.id!, req.params.vehicleId!);
  res.json(expense);
}

export async function create(req: AuthRequest, res: Response) {
  const expense = await expenseService.createExpense(req.params.vehicleId!, req.body);
  res.status(201).json(expense);
}

export async function update(req: AuthRequest, res: Response) {
  const expense = await expenseService.updateExpense(req.params.id!, req.params.vehicleId!, req.body);
  res.json(expense);
}

export async function remove(req: AuthRequest, res: Response) {
  await expenseService.deleteExpense(req.params.id!, req.params.vehicleId!);
  res.status(204).send();
}

export async function getSummary(req: AuthRequest, res: Response) {
  const summary = await expenseService.getExpenseSummary(req.params.vehicleId!);
  res.json(summary);
}

export async function getUserSummary(req: AuthRequest, res: Response) {
  const summary = await expenseService.getUserExpenseSummary(req.user!.userId);
  res.json(summary);
}
