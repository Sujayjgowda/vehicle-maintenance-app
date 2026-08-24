import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as authService from "../services/auth.service";

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  res.json(result);
}

export async function getProfile(req: AuthRequest, res: Response) {
  const user = await authService.getProfile(req.user!.userId);
  res.json(user);
}
