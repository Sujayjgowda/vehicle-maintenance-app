import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as serviceCenterService from "../services/serviceCenter.service";

export async function getAll(req: AuthRequest, res: Response) {
  const centers = await serviceCenterService.getAllServiceCenters(req.user!.userId);
  res.json(centers);
}

export async function getById(req: AuthRequest, res: Response) {
  const center = await serviceCenterService.getServiceCenterById(req.params.id!, req.user!.userId);
  res.json(center);
}

export async function create(req: AuthRequest, res: Response) {
  const center = await serviceCenterService.createServiceCenter(req.user!.userId, req.body);
  res.status(201).json(center);
}

export async function update(req: AuthRequest, res: Response) {
  const center = await serviceCenterService.updateServiceCenter(req.params.id!, req.user!.userId, req.body);
  res.json(center);
}

export async function remove(req: AuthRequest, res: Response) {
  await serviceCenterService.deleteServiceCenter(req.params.id!, req.user!.userId);
  res.status(204).send();
}
