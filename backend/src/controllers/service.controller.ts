import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as serviceService from "../services/service.service";

export async function getAll(req: AuthRequest, res: Response) {
  const records = await serviceService.getAllServiceRecords(req.params.vehicleId!);
  res.json(records);
}

export async function getById(req: AuthRequest, res: Response) {
  const record = await serviceService.getServiceRecordById(req.params.id!, req.params.vehicleId!);
  res.json(record);
}

export async function create(req: AuthRequest, res: Response) {
  const record = await serviceService.createServiceRecord(req.params.vehicleId!, req.body);
  res.status(201).json(record);
}

export async function update(req: AuthRequest, res: Response) {
  const record = await serviceService.updateServiceRecord(req.params.id!, req.params.vehicleId!, req.body);
  res.json(record);
}

export async function remove(req: AuthRequest, res: Response) {
  await serviceService.deleteServiceRecord(req.params.id!, req.params.vehicleId!);
  res.status(204).send();
}
