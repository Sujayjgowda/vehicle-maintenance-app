import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as aiService from "../services/ai.service";

export async function diagnose(req: AuthRequest, res: Response) {
  const { symptoms, vehicleInfo } = req.body;
  if (!symptoms) {
    return res.status(400).json({ error: "Symptoms or issue description is required" });
  }
  const result = await aiService.diagnoseVehicleIssue(symptoms, vehicleInfo);
  res.json(result);
}

export async function getPredictiveHealth(req: AuthRequest, res: Response) {
  const { vehicleId } = req.params;
  const result = await aiService.getPredictiveHealth(vehicleId!);
  res.json(result);
}

export async function parseReceipt(req: AuthRequest, res: Response) {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Receipt text is required" });
  }
  const result = await aiService.parseReceiptText(text);
  res.json(result);
}
