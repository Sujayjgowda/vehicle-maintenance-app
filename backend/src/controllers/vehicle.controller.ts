import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as vehicleService from "../services/vehicle.service";

export async function getAll(req: AuthRequest, res: Response) {
  const vehicles = await vehicleService.getAllVehicles(req.user!.userId);
  res.json(vehicles);
}

export async function getById(req: AuthRequest, res: Response) {
  const vehicle = await vehicleService.getVehicleById(req.params.id!, req.user!.userId);
  res.json(vehicle);
}

export async function create(req: AuthRequest, res: Response) {
  const vehicle = await vehicleService.createVehicle(req.user!.userId, req.body);
  res.status(201).json(vehicle);
}

export async function update(req: AuthRequest, res: Response) {
  const vehicle = await vehicleService.updateVehicle(req.params.id!, req.user!.userId, req.body);
  res.json(vehicle);
}

export async function remove(req: AuthRequest, res: Response) {
  await vehicleService.deleteVehicle(req.params.id!, req.user!.userId);
  res.status(204).send();
}
