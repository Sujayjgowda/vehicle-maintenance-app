import prisma from "../lib/prisma";
import type { CreateDocumentInput, UpdateDocumentInput } from "../validators/document.validator";

export async function getAllDocuments(vehicleId: string) {
  return prisma.document.findMany({
    where: { vehicleId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocumentById(id: string, vehicleId: string) {
  const doc = await prisma.document.findFirst({ where: { id, vehicleId } });
  if (!doc) {
    const err = new Error("Document not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return doc;
}

export async function createDocument(vehicleId: string, data: CreateDocumentInput) {
  return prisma.document.create({
    data: {
      vehicleId,
      docType: data.docType as any,
      title: data.title,
      fileUrl: data.fileUrl,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    },
  });
}

export async function updateDocument(id: string, vehicleId: string, data: UpdateDocumentInput) {
  const existing = await prisma.document.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Document not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return prisma.document.update({
    where: { id },
    data: {
      ...(data.docType !== undefined && { docType: data.docType as any }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
      ...(data.expiryDate !== undefined && { expiryDate: new Date(data.expiryDate) }),
    },
  });
}

export async function deleteDocument(id: string, vehicleId: string) {
  const existing = await prisma.document.findFirst({ where: { id, vehicleId } });
  if (!existing) {
    const err = new Error("Document not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return prisma.document.delete({ where: { id } });
}
