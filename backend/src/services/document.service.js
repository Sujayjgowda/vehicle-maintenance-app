"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDocuments = getAllDocuments;
exports.getDocumentById = getDocumentById;
exports.createDocument = createDocument;
exports.updateDocument = updateDocument;
exports.deleteDocument = deleteDocument;
const prisma_1 = __importDefault(require("../lib/prisma"));
async function getAllDocuments(vehicleId) {
    return prisma_1.default.document.findMany({
        where: { vehicleId },
        orderBy: { createdAt: "desc" },
    });
}
async function getDocumentById(id, vehicleId) {
    const doc = await prisma_1.default.document.findFirst({ where: { id, vehicleId } });
    if (!doc) {
        const err = new Error("Document not found");
        err.statusCode = 404;
        throw err;
    }
    return doc;
}
async function createDocument(vehicleId, data) {
    return prisma_1.default.document.create({
        data: {
            vehicleId,
            docType: data.docType,
            title: data.title,
            fileUrl: data.fileUrl,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        },
    });
}
async function updateDocument(id, vehicleId, data) {
    const existing = await prisma_1.default.document.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Document not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.document.update({
        where: { id },
        data: {
            ...(data.docType !== undefined && { docType: data.docType }),
            ...(data.title !== undefined && { title: data.title }),
            ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
            ...(data.expiryDate !== undefined && { expiryDate: new Date(data.expiryDate) }),
        },
    });
}
async function deleteDocument(id, vehicleId) {
    const existing = await prisma_1.default.document.findFirst({ where: { id, vehicleId } });
    if (!existing) {
        const err = new Error("Document not found");
        err.statusCode = 404;
        throw err;
    }
    return prisma_1.default.document.delete({ where: { id } });
}
//# sourceMappingURL=document.service.js.map