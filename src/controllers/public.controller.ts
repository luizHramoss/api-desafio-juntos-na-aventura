import { Request, Response } from "express";
import { getPublicDataByToken } from "../services/public.service";

export async function getPublicByToken(req: Request, res: Response) {
  const token = String(req.params.token ?? "").trim();
  if (!token) return res.status(400).json({ error: "token is required" });

  try {
    const data = await getPublicDataByToken(token);
    return res.json(data);
  } catch (e: any) {
    const msg = e?.message ?? "Unknown error";
    const status = msg === "Invalid token" ? 404 : 400;
    return res.status(status).json({ error: msg });
  }
}