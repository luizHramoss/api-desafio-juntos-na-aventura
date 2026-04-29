import { Router } from "express";
import { getAdventureById, listAdventures } from "./controllers/adventures.controller";
import { createReservation } from "./controllers/reservations.controller";
import { getPublicByToken } from "./controllers/public.controller";

export const routes = Router();

routes.get("/adventures", listAdventures);
routes.get("/adventures/:id", getAdventureById);
routes.post("/reservations", createReservation);
routes.get("/public/:token", getPublicByToken);