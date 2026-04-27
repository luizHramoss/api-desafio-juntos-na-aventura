import { Request, Response } from "express";
import { prisma } from "../prisma";

export async function getAdventureById(req: Request, res: Response) {
  const id = String(req.params.id);

  const adventure = await prisma.adventure.findUnique({
    where: { id },
    include: { pricings: true },
  });

  if (!adventure) return res.status(404).json({ error: "Adventure not found" });
  return res.json(adventure);
}