import { Request, Response } from "express";
import { validateCreateReservation } from "../validators/reservations.validator";
import { createReservation as createReservationService } from "../services/reservations.service";

export async function createReservation(req: Request, res: Response) {
  const v = validateCreateReservation(req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  try {
    const result = await createReservationService(v.data!);
    return res.status(201).json(result);
  } catch (e: any) {
    const msg = e?.message ?? "Unknown error";
    const status =
      msg === "Adventure not found" ? 404 :
      msg === "Adventure is full" ? 409 :
      400;
    return res.status(status).json({ error: msg });
  }
}