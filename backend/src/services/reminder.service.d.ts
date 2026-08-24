import type { CreateReminderInput, UpdateReminderInput } from "../validators/reminder.validator";
export declare function getAllReminders(vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    title: string | null;
    type: import(".prisma/client").$Enums.ReminderType;
    dueDate: Date | null;
    dueKm: number | null;
    status: import(".prisma/client").$Enums.ReminderStatus;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function getReminderById(id: string, vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    title: string | null;
    type: import(".prisma/client").$Enums.ReminderType;
    dueDate: Date | null;
    dueKm: number | null;
    status: import(".prisma/client").$Enums.ReminderStatus;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function createReminder(vehicleId: string, data: CreateReminderInput): Promise<{
    id: string;
    vehicleId: string;
    title: string | null;
    type: import(".prisma/client").$Enums.ReminderType;
    dueDate: Date | null;
    dueKm: number | null;
    status: import(".prisma/client").$Enums.ReminderStatus;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateReminder(id: string, vehicleId: string, data: UpdateReminderInput): Promise<{
    id: string;
    vehicleId: string;
    title: string | null;
    type: import(".prisma/client").$Enums.ReminderType;
    dueDate: Date | null;
    dueKm: number | null;
    status: import(".prisma/client").$Enums.ReminderStatus;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteReminder(id: string, vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    title: string | null;
    type: import(".prisma/client").$Enums.ReminderType;
    dueDate: Date | null;
    dueKm: number | null;
    status: import(".prisma/client").$Enums.ReminderStatus;
    createdAt: Date;
    updatedAt: Date;
}>;
/** Get upcoming/overdue reminders for a user across all vehicles */
export declare function getUpcomingReminders(userId: string): Promise<({
    vehicle: {
        licensePlate: string;
        make: string;
        model: string;
    };
} & {
    id: string;
    vehicleId: string;
    title: string | null;
    type: import(".prisma/client").$Enums.ReminderType;
    dueDate: Date | null;
    dueKm: number | null;
    status: import(".prisma/client").$Enums.ReminderStatus;
    createdAt: Date;
    updatedAt: Date;
})[]>;
//# sourceMappingURL=reminder.service.d.ts.map