import prisma from "../lib/prisma";
import type { CreateReminderInput, UpdateReminderInput } from "../validators/reminder.validator";

export async function getAllReminders(vehicleId: string) {
  return prisma.reminder.findMany({
    where: { vehicleId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
}

export async function getReminderById(id: string, vehicleId: string) {
  const reminder = await prisma.reminder.findFirst({ where: { id, vehicleId } });
  if (!reminder) {
    const err = new Error("Reminder not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return reminder;
}

export async function createReminder(vehicleId: string, data: CreateReminderInput) {
  return prisma.reminder.create({
    data: {
      vehicleId,
      title: data.title,
      type: data.type as any,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      dueKm: data.dueKm,
      status: (data.status as any) || "PENDING",
    },
  });
}

export async function updateReminder(id: string, vehicleId: string, data: UpdateReminderInput) {
  const existing = await prisma.reminder.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Reminder not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return prisma.reminder.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.type !== undefined && { type: data.type as any }),
      ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
      ...(data.dueKm !== undefined && { dueKm: data.dueKm }),
      ...(data.status !== undefined && { status: data.status as any }),
    },
  });
}

export async function deleteReminder(id: string, vehicleId: string) {
  const existing = await prisma.reminder.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Reminder not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return prisma.reminder.delete({ where: { id } });
}

/** Get upcoming/overdue reminders for a user across all vehicles */
export async function getUpcomingReminders(userId: string) {
  return prisma.reminder.findMany({
    where: {
      vehicle: { userId },
      status: { in: ["PENDING", "OVERDUE"] },
    },
    include: {
      vehicle: { select: { make: true, model: true, licensePlate: true } },
    },
    orderBy: { dueDate: "asc" },
    take: 20,
  });
}
