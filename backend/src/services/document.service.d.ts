import type { CreateDocumentInput, UpdateDocumentInput } from "../validators/document.validator";
export declare function getAllDocuments(vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    docType: import(".prisma/client").$Enums.DocType;
    title: string | null;
    fileUrl: string;
    expiryDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function getDocumentById(id: string, vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    docType: import(".prisma/client").$Enums.DocType;
    title: string | null;
    fileUrl: string;
    expiryDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function createDocument(vehicleId: string, data: CreateDocumentInput): Promise<{
    id: string;
    vehicleId: string;
    docType: import(".prisma/client").$Enums.DocType;
    title: string | null;
    fileUrl: string;
    expiryDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateDocument(id: string, vehicleId: string, data: UpdateDocumentInput): Promise<{
    id: string;
    vehicleId: string;
    docType: import(".prisma/client").$Enums.DocType;
    title: string | null;
    fileUrl: string;
    expiryDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function deleteDocument(id: string, vehicleId: string): Promise<{
    id: string;
    vehicleId: string;
    docType: import(".prisma/client").$Enums.DocType;
    title: string | null;
    fileUrl: string;
    expiryDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=document.service.d.ts.map