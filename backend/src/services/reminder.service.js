"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReminders = getAllReminders;
exports.getReminderById = getReminderById;
exports.createReminder = createReminder;
exports.updateReminder = updateReminder;
exports.deleteReminder = deleteReminder;
exports.getUpcomingReminders = getUpcomingReminders;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function getAllReminders(vehicleId) {
    return prisma_1.default.reminder.findMany({
        where: { vehicleId },
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    });
}
async function getReminderById(id, vehicleId) {
    const reminder = await prisma_1.default.reminder.findFirst({ where: { id, vehicleId } });
    if (!reminder) {
        const err = new Error("Reminder not found");
        err.statusCode = 404;
        throw err;
    }
    return reminder;
}
async function createReminder(vehicleId, data) {
    return prisma_1.default.reminder.create({
        data: {
            vehicleId,
            title: data.title,
            type: data.type,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            dueKm: data.dueKm,
            status: data.status || "PENDING",
        },
    });
}
async function updateReminder(id, vehicleId, data) {
    const existing = await prisma_1.default.reminder.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Reminder not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.reminder.update({
        where: { id },
        data: {
            ...(data.title !== undefined && { title: data.title }),
            ...(data.type !== undefined && { type: data.type }),
            ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
            ...(data.dueKm !== undefined && { dueKm: data.dueKm }),
            ...(data.status !== undefined && { status: data.status }),
        },
    });
}
async function deleteReminder(id, vehicleId) {
    const existing = await prisma_1.default.reminder.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Reminder not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.reminder.delete({ where: { id } });
}
/** Get upcoming/overdue reminders for a user across all vehicles */
async function getUpcomingReminders(userId) {
    return prisma_1.default.reminder.findMany({
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
//# sourceMappingURL=reminder.service.js.map