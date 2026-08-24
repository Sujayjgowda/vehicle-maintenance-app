import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as partService from "../services/part.service";

export async function getAll(req: AuthRequest, res: Response) {
  const records = await partService.getAllPartRecords(req.params.vehicleId!);
  res.json(records);
}

export async function getById(req: AuthRequest, res: Response) {
  const record = await partService.getPartRecordById(req.params.id!, req.params.vehicleId!);
  res.json(record);
}

export async function create(req: AuthRequest, res: Response) {
  const record = await partService.createPartRecord(req.params.vehicleId!, req.body);
  res.status(201).json(record);
}

export async function update(req: AuthRequest, res: Response) {
  const record = await partService.updatePartRecord(req.params.id!, req.params.vehicleId!, req.body);
  res.json(record);
}

export async function remove(req: AuthRequest, res: Response) {
  await partService.deletePartRecord(req.params.id!, req.params.vehicleId!);
  res.status(204).send();
}
