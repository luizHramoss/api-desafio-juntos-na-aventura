import express from "express";
import cors from "cors";
import { routes } from "./routes";

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(routes);