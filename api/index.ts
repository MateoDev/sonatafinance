// @ts-nocheck
/**
 * Vercel serverless handler — reuses the same Express app as local dev.
 * No route duplication. All logic lives in server/routes.ts + server/auth.ts.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { setupAuth, isAuthenticated } from "../server/auth";
import { registerRoutes } from "../server/routes";

let app: express.Express | null = null;

async function getApp() {
  if (app) return app;

  app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // CORS for Vercel
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.status(200).end();
    next();
  });

  // registerRoutes calls setupAuth internally + mounts all API routes
  await registerRoutes(app);

  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const expressApp = await getApp();
  return expressApp(req as any, res as any);
}
