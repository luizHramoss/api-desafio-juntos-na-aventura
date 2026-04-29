import express from "express";
import cors from "cors";
import { routes } from "./routes";

export const app = express();

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((v) => v.trim())
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(routes);