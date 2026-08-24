import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as reminderService from "../services/reminder.service";

export async function getAll(req: AuthRequest, res: Response) {
  const reminders = await reminderService.getAllReminders(req.params.vehicleId!);
  res.json(reminders);
}

export async function getById(req: AuthRequest, res: Response) {
  const reminder = await reminderService.getReminderById(req.params.id!, req.params.vehicleId!);
  res.json(reminder);
}

export async function create(req: AuthRequest, res: Response) {
  const reminder = await reminderService.createReminder(req.params.vehicleId!, req.body);
  res.status(201).json(reminder);
}

export async function update(req: AuthRequest, res: Response) {
  const reminder = await reminderService.updateReminder(req.params.id!, req.params.vehicleId!, req.body);
  res.json(reminder);
}

export async function remove(req: AuthRequest, res: Response) {
  await reminderService.deleteReminder(req.params.id!, req.params.vehicleId!);
  res.status(204).send();
}

export async function getUpcoming(req: AuthRequest, res: Response) {
  const reminders = await reminderService.getUpcomingReminders(req.user!.userId);
  res.json(reminders);
}
