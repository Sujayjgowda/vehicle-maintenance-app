import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as repairService from "../services/repair.service";

export async function getAll(req: AuthRequest, res: Response) {
  const logs = await repairService.getAllRepairLogs(req.params.vehicleId!);
  res.json(logs);
}

export async function getById(req: AuthRequest, res: Response) {
  const log = await repairService.getRepairLogById(req.params.id!, req.params.vehicleId!);
  res.json(log);
}

export async function create(req: AuthRequest, res: Response) {
  const log = await repairService.createRepairLog(req.params.vehicleId!, req.body);
  res.status(201).json(log);
}

export async function update(req: AuthRequest, res: Response) {
  const log = await repairService.updateRepairLog(req.params.id!, req.params.vehicleId!, req.body);
  res.json(log);
}

export async function remove(req: AuthRequest, res: Response) {
  await repairService.deleteRepairLog(req.params.id!, req.params.vehicleId!);
  res.status(204).send();
}
