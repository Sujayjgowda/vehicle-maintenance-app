import type { CreateExpenseInput, UpdateExpenseInput } from "../validators/expense.validator";
export declare function getAllExpenses(vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    category: import(".prisma/client").$Enums.ExpenseCategory;
    amount: number;
    date: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function getExpenseById(id: string, vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    category: import(".prisma/client").$Enums.ExpenseCategory;
    amount: number;
    date: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function createExpense(vehicleId: string, data: CreateExpenseInput): Promise<{
    id: string;
    vehicleId: string;
    category: import(".prisma/client").$Enums.ExpenseCategory;
    amount: number;
    date: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateExpense(id: string, vehicleId: string, data: UpdateExpenseInput): Promise<{
    id: string;
    vehicleId: string;
    category: import(".prisma/client").$Enums.ExpenseCategory;
    amount: number;
    date: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteExpense(id: string, vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    category: import(".prisma/client").$Enums.ExpenseCategory;
    amount: number;
    date: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/** Aggregate expense summary grouped by category and month for a vehicle */
export declare function getExpenseSummary(vehicleId: string): Promise<{
    totalExpenses: number;
    count: number;
    byCategory: Record<string, number>;
    byMonth: Record<string, number>;
}>;
/** Summary across all vehicles for a user */
export declare function getUserExpenseSummary(userId: string): Promise<{
    total: number;
    count: number;
    byVehicle: {
        vehicle: string;
        total: number;
    }[];
}>;
//# sourceMappingURL=expense.service.d.ts.map