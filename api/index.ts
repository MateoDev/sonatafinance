// @ts-nocheck
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "";
  const method = req.method || "GET";
  const db = getPool();

  try {
    // POST /api/auth/thirdweb
    if (url.includes("/auth/thirdweb") && method === "POST") {
      const { walletAddress, email, name } = req.body || {};
      if (!walletAddress) return res.status(400).json({ error: "Wallet address required" });

      const addr = walletAddress.toLowerCase();

      // Check if user exists
      let result = await db.query("SELECT * FROM users WHERE wallet_address = $1", [addr]);
      let user = result.rows[0];

      if (!user && email) {
        result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        user = result.rows[0];
        if (user) {
          await db.query("UPDATE users SET wallet_address = $1, updated_at = NOW() WHERE id = $2", [addr, user.id]);
        }
      }

      if (!user) {
        const username = email
          ? email.split("@")[0] + "_" + Date.now().toString(36)
          : `wallet_${addr.slice(2, 10)}_${Date.now().toString(36)}`;

        result = await db.query(
          `INSERT INTO users (username, password, name, email, wallet_address, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
          [username, "disabled", name || "", email || "", addr]
        );
        user = result.rows[0];
      }

      // Update last login
      await db.query("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [user.id]);

      // Generate simple session token
      const crypto = await import("crypto");
      const token = crypto.randomBytes(48).toString("hex");

      // Store session in DB (add sessions table or use simple approach)
      // For now, encode user ID in token (base64)
      const sessionToken = Buffer.from(JSON.stringify({ userId: user.id, t: Date.now() })).toString("base64url") + "." + token;

      const { password, ...safeUser } = user;
      return res.json({ user: safeUser, token: sessionToken });
    }

    // GET /api/user
    if (url.includes("/api/user") && !url.includes("/profile") && method === "GET") {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const token = authHeader.slice(7);
      try {
        const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
        const result = await db.query("SELECT * FROM users WHERE id = $1", [payload.userId]);
        if (!result.rows[0]) return res.status(401).json({ error: "User not found" });
        const { password, ...safeUser } = result.rows[0];
        return res.json(safeUser);
      } catch {
        return res.status(401).json({ error: "Invalid token" });
      }
    }

    // PATCH /api/user/profile
    if (url.includes("/user/profile") && method === "PATCH") {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const token = authHeader.slice(7);
      try {
        const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
        const { name, email, profileImage } = req.body || {};
        const sets: string[] = [];
        const vals: any[] = [];
        let idx = 1;
        if (name !== undefined) { sets.push(`name = $${idx++}`); vals.push(name); }
        if (email !== undefined) { sets.push(`email = $${idx++}`); vals.push(email); }
        if (profileImage !== undefined) { sets.push(`profile_image = $${idx++}`); vals.push(profileImage); }
        sets.push(`updated_at = NOW()`);
        vals.push(payload.userId);

        const result = await db.query(
          `UPDATE users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`,
          vals
        );
        if (!result.rows[0]) return res.status(404).json({ error: "User not found" });
        const { password, ...safeUser } = result.rows[0];
        return res.json(safeUser);
      } catch {
        return res.status(401).json({ error: "Invalid token" });
      }
    }

    // GET /api/investments
    if (url.includes("/api/investments") && method === "GET") {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated" });
      const token = authHeader.slice(7);
      const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
      const result = await db.query("SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC", [payload.userId]);
      return res.json(result.rows);
    }

    // GET /api/budget
    if (url.includes("/api/budget") && method === "GET") {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated" });
      const token = authHeader.slice(7);
      const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
      const result = await db.query("SELECT * FROM budget_items WHERE user_id = $1 ORDER BY created_at DESC", [payload.userId]);
      return res.json(result.rows);
    }

    // GET /api/liabilities
    if (url.includes("/api/liabilities") && method === "GET") {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated" });
      const token = authHeader.slice(7);
      const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
      const result = await db.query("SELECT * FROM liabilities WHERE user_id = $1 ORDER BY created_at DESC", [payload.userId]);
      return res.json(result.rows);
    }

    // GET /api/goals
    if (url.includes("/api/goals") && method === "GET") {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated" });
      const token = authHeader.slice(7);
      const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
      const result = await db.query("SELECT * FROM financial_goals WHERE user_id = $1 ORDER BY created_at DESC", [payload.userId]);
      return res.json(result.rows);
    }

    // GET /api/portfolio/summary
    if (url.includes("/api/portfolio/summary") && method === "GET") {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Not authenticated" });
      const token = authHeader.slice(7);
      const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
      
      const investments = await db.query("SELECT * FROM investments WHERE user_id = $1", [payload.userId]);
      const liabilities = await db.query("SELECT * FROM liabilities WHERE user_id = $1", [payload.userId]);
      
      const totalAssets = investments.rows.reduce((sum: number, inv: any) => sum + parseFloat(inv.current_value || inv.cost_basis || 0), 0);
      const totalLiabilities = liabilities.rows.reduce((sum: number, l: any) => sum + parseFloat(l.current_balance || l.original_amount || 0), 0);
      
      return res.json({
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
        investmentCount: investments.rows.length,
        liabilityCount: liabilities.rows.length,
      });
    }

    // POST /api/logout
    if (url.includes("/api/logout") && method === "POST") {
      return res.status(200).json({ ok: true });
    }

    return res.status(404).json({ error: "Not found", path: url });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
