import { Request, Response } from "express";
import { getAdventureById as getAdventureByIdService, listAdventures as listAdventuresService } from "../services/adventures.service";

export async function listAdventures(_req: Request, res: Response) {
  const adventures = await listAdventuresService();
  return res.json(adventures);
}

export async function getAdventureById(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    const adventure = await getAdventureByIdService(id);
    return res.json(adventure);
  } catch (e: any) {
    const msg = e?.message ?? "Unknown error";
    const status = msg === "Adventure not found" ? 404 : 400;
    return res.status(status).json({ error: msg });
  }
}