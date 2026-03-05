// @ts-nocheck
import { Express, Request, Response, NextFunction } from "express";
import { createThirdwebClient, verifySignature } from "thirdweb";
import { storage } from "./storage";
import { User as SelectUser, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

// ThirdWeb client for server-side verification
const thirdwebClient = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY || "",
});

// Simple in-memory session store mapping token -> userId
// In production, use Redis or DB-backed sessions
const sessions = new Map<string, number>();

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Generate a session token
function generateSessionToken(): string {
  return randomBytes(48).toString("hex");
}

// Middleware to extract user from session token
async function extractUser(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const userId = sessions.get(token);
    if (userId) {
      const user = await storage.getUserById(userId);
      if (user) {
        (req as any).user = user;
      }
    }
  }
  next();
}

export function setupAuth(app: Express) {
  // Apply user extraction middleware
  app.use(extractUser);

  // ThirdWeb wallet authentication endpoint
  // Called after ConnectButton login on the client
  app.post("/api/auth/thirdweb", async (req: Request, res: Response) => {
    try {
      const { walletAddress, email, name, profileImage } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address is required" });
      }

      const normalizedAddress = walletAddress.toLowerCase();

      // Look up user by wallet address
      let user = await storage.getUserByWalletAddress(normalizedAddress);

      // If not found by wallet, try by email
      if (!user && email) {
        user = await storage.getUserByEmail(email);
        if (user) {
          // Link wallet to existing email-based account
          await db.update(users)
            .set({ walletAddress: normalizedAddress, updatedAt: new Date() })
            .where(eq(users.id, user.id));
        }
      }

      // Create new user if not found
      if (!user) {
        const username = email
          ? email.split("@")[0] + "_" + Date.now().toString(36)
          : `wallet_${normalizedAddress.slice(2, 10)}_${Date.now().toString(36)}`;

        user = await storage.createUser({
          username,
          password: randomBytes(32).toString("hex"), // random unusable password
          name: name || "",
          email: email || "",
          profileImage: profileImage || "",
        });

        // Set wallet address
        await db.update(users)
          .set({ walletAddress: normalizedAddress, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Generate session token
      const sessionToken = generateSessionToken();
      sessions.set(sessionToken, user.id);

      // Refresh user data
      user = await storage.getUserById(user.id);

      const { password, ...userWithoutPassword } = user!;
      res.json({ user: userWithoutPassword, token: sessionToken });
    } catch (error) {
      console.error("ThirdWeb auth error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Get current user
  app.get("/api/user", (req: Request, res: Response) => {
    if (!(req as any).user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { password, ...userWithoutPassword } = (req as any).user;
    res.json(userWithoutPassword);
  });

  // Logout
  app.post("/api/logout", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      sessions.delete(token);
    }
    res.sendStatus(200);
  });
}

// Auth middleware for protected routes
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if ((req as any).user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
