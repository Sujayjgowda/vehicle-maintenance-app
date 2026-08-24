import type { CreateRepairLogInput, UpdateRepairLogInput } from "../validators/repair.validator";
export declare function getAllRepairLogs(vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    odometer: number;
    description: string;
    cause: string | null;
    location: string | null;
    cost: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function getRepairLogById(id: string, vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    odometer: number;
    description: string;
    cause: string | null;
    location: string | null;
    cost: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function createRepairLog(vehicleId: string, data: CreateRepairLogInput): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    odometer: number;
    description: string;
    cause: string | null;
    location: string | null;
    cost: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateRepairLog(id: string, vehicleId: string, data: UpdateRepairLogInput): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    odometer: number;
    description: string;
    cause: string | null;
    location: string | null;
    cost: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteRepairLog(id: string, vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    odometer: number;
    description: string;
    cause: string | null;
    location: string | null;
    cost: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=repair.service.d.ts.map