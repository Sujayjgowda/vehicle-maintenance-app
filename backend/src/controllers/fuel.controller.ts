import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as fuelService from "../services/fuel.service";

export async function getAll(req: AuthRequest, res: Response) {
  const records = await fuelService.getAllFuelRecords(req.params.vehicleId!);
  res.json(records);
}

export async function getById(req: AuthRequest, res: Response) {
  const record = await fuelService.getFuelRecordById(req.params.id!, req.params.vehicleId!);
  res.json(record);
}

export async function create(req: AuthRequest, res: Response) {
  const record = await fuelService.createFuelRecord(req.params.vehicleId!, req.body);
  res.status(201).json(record);
}

export async function update(req: AuthRequest, res: Response) {
  const record = await fuelService.updateFuelRecord(req.params.id!, req.params.vehicleId!, req.body);
  res.json(record);
}

export async function remove(req: AuthRequest, res: Response) {
  await fuelService.deleteFuelRecord(req.params.id!, req.params.vehicleId!);
  res.status(204).send();
}

export async function getSummary(req: AuthRequest, res: Response) {
  const summary = await fuelService.getFuelSummary(req.params.vehicleId!);
  res.json(summary);
}
