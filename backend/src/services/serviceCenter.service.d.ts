import type { CreateServiceCenterInput, UpdateServiceCenterInput } from "../validators/serviceCenter.validator";
export declare function getAllServiceCenters(userId: string): Promise<{
    id: string;
    userId: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function getServiceCenterById(id: string, userId: string): Promise<{
    id: string;
    userId: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function createServiceCenter(userId: string, data: CreateServiceCenterInput): Promise<{
    id: string;
    userId: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateServiceCenter(id: string, userId: string, data: UpdateServiceCenterInput): Promise<{
    id: string;
    userId: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteServiceCenter(id: string, userId: string): Promise<{
    id: string;
    userId: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=serviceCenter.service.d.ts.map