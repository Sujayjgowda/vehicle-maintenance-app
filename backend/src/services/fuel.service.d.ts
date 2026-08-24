import type { CreateFuelRecordInput, UpdateFuelRecordInput } from "../validators/fuel.validator";
export declare function getAllFuelRecords(vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    liters: number;
    cost: number;
    odometerReading: number;
    averageKmpl: number | null;
    costPerKm: number | null;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function getFuelRecordById(id: string, vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    liters: number;
    cost: number;
    odometerReading: number;
    averageKmpl: number | null;
    costPerKm: number | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function createFuelRecord(vehicleId: string, data: CreateFuelRecordInput): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    liters: number;
    cost: number;
    odometerReading: number;
    averageKmpl: number | null;
    costPerKm: number | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateFuelRecord(id: string, vehicleId: string, data: UpdateFuelRecordInput): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    liters: number;
    cost: number;
    odometerReading: number;
    averageKmpl: number | null;
    costPerKm: number | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteFuelRecord(id: string, vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    date: Date;
    liters: number;
    cost: number;
    odometerReading: number;
    averageKmpl: number | null;
    costPerKm: number | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/** Monthly fuel expenditure summary for a vehicle */
export declare function getFuelSummary(vehicleId: string): Promise<{
    totalRecords: number;
    totalCost: number;
    totalLiters: number;
    latestAvgKmpl: number | null;
    monthlyTotals: Record<string, {
        totalCost: number;
        totalLiters: number;
        count: number;
    }>;
}>;
//# sourceMappingURL=fuel.service.d.ts.map