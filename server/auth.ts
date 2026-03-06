// @ts-nocheck
import { Express, Request, Response, NextFunction } from "express";
import { createThirdwebClient } from "thirdweb";
import { storage } from "./storage";
import { User as SelectUser, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";

// ThirdWeb client for server-side verification
const thirdwebClient = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY || "",
});

// JWT secret — falls back to a random key per process (dev only)
const JWT_SECRET = process.env.JWT_SECRET || randomBytes(64).toString("hex");
const JWT_EXPIRES_IN = "30d";

if (!process.env.JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET not set — using random key. Sessions won't survive restarts. Set JWT_SECRET in production.");
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Sign a JWT for a user
function signToken(userId: number): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify and decode a JWT — returns userId or null
function verifyToken(token: string): number | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: number };
    return payload.sub;
  } catch {
    return null;
  }
}

// Middleware to extract user from JWT Bearer token
async function extractUser(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const userId = verifyToken(token);
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

      // Sign JWT
      const token = signToken(user.id);

      // Refresh user data
      user = await storage.getUserById(user.id);

      const { password, ...userWithoutPassword } = user!;
      res.json({ user: userWithoutPassword, token });
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

  // Update user profile
  app.patch("/api/user/profile", async (req: Request, res: Response) => {
    if (!(req as any).user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const updated = await storage.updateUser((req as any).user.id, req.body);
      if (!updated) return res.status(404).json({ error: "User not found" });
      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Logout — JWT is stateless, client just discards the token
  // Endpoint kept for API compatibility
  app.post("/api/logout", (_req: Request, res: Response) => {
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
