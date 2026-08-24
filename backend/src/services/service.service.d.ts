import type { CreateServiceRecordInput, UpdateServiceRecordInput } from "../validators/service.validator";
export declare function getAllServiceRecords(vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    odometer: number;
    serviceType: string;
    serviceCenter: string | null;
    cost: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function getServiceRecordById(id: string, vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    odometer: number;
    serviceType: string;
    serviceCenter: string | null;
    cost: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function createServiceRecord(vehicleId: string, data: CreateServiceRecordInput): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    odometer: number;
    serviceType: string;
    serviceCenter: string | null;
    cost: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateServiceRecord(id: string, vehicleId: string, data: UpdateServiceRecordInput): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    odometer: number;
    serviceType: string;
    serviceCenter: string | null;
    cost: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteServiceRecord(id: string, vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    odometer: number;
    serviceType: string;
    serviceCenter: string | null;
    cost: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=service.service.d.ts.map