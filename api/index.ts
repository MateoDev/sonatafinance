// @ts-nocheck
import express from "express";
import { registerRoutes } from "../server/routes";
import { setupAuth } from "../server/auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup auth and routes (registerRoutes also creates httpServer but we ignore it)
setupAuth(app);

let initialized = false;
const initPromise = registerRoutes(app).then(() => {
  initialized = true;
});

// Vercel serverless handler
export default async function handler(req: any, res: any) {
  if (!initialized) await initPromise;
  return app(req, res);
}
