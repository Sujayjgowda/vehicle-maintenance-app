import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as documentService from "../services/document.service";

export async function getAll(req: AuthRequest, res: Response) {
  const docs = await documentService.getAllDocuments(req.params.vehicleId!);
  res.json(docs);
}

export async function getById(req: AuthRequest, res: Response) {
  const doc = await documentService.getDocumentById(req.params.id!, req.params.vehicleId!);
  res.json(doc);
}

export async function create(req: AuthRequest, res: Response) {
  const doc = await documentService.createDocument(req.params.vehicleId!, req.body);
  res.status(201).json(doc);
}

export async function update(req: AuthRequest, res: Response) {
  const doc = await documentService.updateDocument(req.params.id!, req.params.vehicleId!, req.body);
  res.json(doc);
}

export async function remove(req: AuthRequest, res: Response) {
  await documentService.deleteDocument(req.params.id!, req.params.vehicleId!);
  res.status(204).send();
}
