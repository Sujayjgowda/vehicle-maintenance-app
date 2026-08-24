import type { CreateVehicleInput, UpdateVehicleInput } from "../validators/vehicle.validator";
export declare function getAllVehicles(userId: string): Promise<({
    _count: {
        fuelRecords: number;
        reminders: number;
        serviceRecords: number;
    };
} & {
    id: string;
    userId: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    currentOdometer: number;
    createdAt: Date;
    updatedAt: Date;
})[]>;
export declare function getVehicleById(id: string, userId: string): Promise<{
    _count: {
        expenses: number;
        fuelRecords: number;
        serviceRecords: number;
    };
    reminders: {
        id: string;
        vehicleId: string;
        title: string | null;
        type: import(".prisma/client").$Enums.ReminderType;
        dueDate: Date | null;
        dueKm: number | null;
        status: import(".prisma/client").$Enums.ReminderStatus;
        createdAt: Date;
        updatedAt: Date;
    }[];
} & {
    id: string;
    userId: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    currentOdometer: number;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function createVehicle(userId: string, data: CreateVehicleInput): Promise<{
    id: string;
    userId: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    currentOdometer: number;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateVehicle(id: string, userId: string, data: UpdateVehicleInput): Promise<{
    id: string;
    userId: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    currentOdometer: number;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteVehicle(id: string, userId: string): Promise<{
    id: string;
    userId: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    currentOdometer: number;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=vehicle.service.d.ts.map