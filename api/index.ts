// @ts-nocheck
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

function parseToken(authHeader: string | undefined) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return JSON.parse(Buffer.from(authHeader.slice(7).split(".")[0], "base64url").toString());
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "";
  const method = req.method || "GET";
  const db = getPool();
  const auth = () => parseToken(req.headers.authorization as string);

  try {
    // POST /api/auth/thirdweb
    if (url.includes("/auth/thirdweb") && method === "POST") {
      const { walletAddress, email, name } = req.body || {};
      if (!walletAddress) return res.status(400).json({ error: "Wallet address required" });
      const addr = walletAddress.toLowerCase();

      let result = await db.query("SELECT * FROM users WHERE wallet_address = $1", [addr]);
      let user = result.rows[0];

      if (!user && email) {
        result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        user = result.rows[0];
        if (user) await db.query("UPDATE users SET wallet_address = $1, updated_at = NOW() WHERE id = $2", [addr, user.id]);
      }

      if (!user) {
        const username = email
          ? email.split("@")[0] + "_" + Date.now().toString(36)
          : `wallet_${addr.slice(2, 10)}_${Date.now().toString(36)}`;
        result = await db.query(
          `INSERT INTO users (username, password, name, email, wallet_address, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
          [username, "disabled", name || "", email || null, addr]
        );
        user = result.rows[0];
      }

      await db.query("UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1", [user.id]);

      const crypto = await import("crypto");
      const token = Buffer.from(JSON.stringify({ userId: user.id, t: Date.now() })).toString("base64url") + "." + crypto.randomBytes(48).toString("hex");
      const { password, ...safeUser } = user;
      return res.json({ user: safeUser, token });
    }

    // GET /api/user
    if (url.match(/\/api\/user\/?$/) && method === "GET") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const result = await db.query("SELECT * FROM users WHERE id = $1", [payload.userId]);
      if (!result.rows[0]) return res.status(401).json({ error: "User not found" });
      const { password, ...safeUser } = result.rows[0];
      return res.json(safeUser);
    }

    // PATCH /api/user/profile
    if (url.includes("/user/profile") && method === "PATCH") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const { name, email, profileImage } = req.body || {};
      const sets: string[] = [];
      const vals: any[] = [];
      let idx = 1;
      if (name !== undefined) { sets.push(`name = $${idx++}`); vals.push(name); }
      if (email !== undefined) { sets.push(`email = $${idx++}`); vals.push(email || null); }
      if (profileImage !== undefined) { sets.push(`profile_image = $${idx++}`); vals.push(profileImage); }
      sets.push(`updated_at = NOW()`);
      vals.push(payload.userId);
      const result = await db.query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`, vals);
      if (!result.rows[0]) return res.status(404).json({ error: "User not found" });
      const { password, ...safeUser } = result.rows[0];
      return res.json(safeUser);
    }

    // GET /api/investments
    if (url.match(/\/api\/investments\/?$/) && method === "GET") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const result = await db.query("SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC", [payload.userId]);
      return res.json(result.rows);
    }

    // GET /api/budget
    if (url.match(/\/api\/budget\/?$/) && method === "GET") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const result = await db.query("SELECT * FROM budget_items WHERE user_id = $1 ORDER BY created_at DESC", [payload.userId]);
      return res.json(result.rows);
    }

    // GET /api/budget/grid — returns full budget grid data
    if (url.match(/\/api\/budget\/grid\/?$/) && method === "GET") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const result = await db.query(
        "SELECT * FROM budget_grid WHERE user_id = $1",
        [payload.userId]
      );
      // Return as a map: { rowId: { monthKey: value } }
      const grid: Record<string, Record<string, number>> = {};
      for (const row of result.rows) {
        if (!grid[row.category]) grid[row.category] = {};
        grid[row.category][row.month] = parseFloat(row.value) || 0;
      }
      return res.json(grid);
    }

    // PATCH /api/budget/cell — update a single cell { month, category, value }
    if (url.match(/\/api\/budget\/cell\/?$/) && method === "PATCH") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const { month, category, value } = req.body || {};
      if (!month || !category || value === undefined) {
        return res.status(400).json({ error: "month, category, and value are required" });
      }
      // Upsert
      await db.query(
        `INSERT INTO budget_grid (user_id, category, month, value, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id, category, month)
         DO UPDATE SET value = $4, updated_at = NOW()`,
        [payload.userId, category, month, value]
      );
      return res.json({ ok: true, month, category, value });
    }

    // GET /api/liabilities
    if (url.match(/\/api\/liabilities\/?$/) && method === "GET") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const result = await db.query("SELECT * FROM liabilities WHERE user_id = $1 ORDER BY created_at DESC", [payload.userId]);
      return res.json(result.rows);
    }

    // GET /api/goals
    if (url.match(/\/api\/goals\/?$/) && method === "GET") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const result = await db.query("SELECT * FROM financial_goals WHERE user_id = $1 ORDER BY created_at DESC", [payload.userId]);
      return res.json(result.rows);
    }

    // GET /api/notes
    if (url.match(/\/api\/notes\/?$/) && method === "GET") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const result = await db.query("SELECT * FROM financial_notes WHERE user_id = $1 ORDER BY created_at DESC", [payload.userId]);
      return res.json(result.rows);
    }

    // GET /api/portfolio/summary
    if (url.includes("/api/portfolio/summary") && method === "GET") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const investments = await db.query("SELECT * FROM investments WHERE user_id = $1", [payload.userId]);
      const liabilities = await db.query("SELECT * FROM liabilities WHERE user_id = $1", [payload.userId]);
      const totalAssets = investments.rows.reduce((sum: number, inv: any) => sum + parseFloat(inv.current_value || inv.cost_basis || 0), 0);
      const totalLiabilities = liabilities.rows.reduce((sum: number, l: any) => sum + parseFloat(l.current_balance || l.original_amount || 0), 0);
      return res.json({ totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities, investmentCount: investments.rows.length, liabilityCount: liabilities.rows.length });
    }

    // GET /api/activities/recent
    if (url.includes("/api/activities") && method === "GET") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const result = await db.query("SELECT * FROM activities WHERE user_id = $1 ORDER BY date DESC LIMIT 20", [payload.userId]);
      return res.json(result.rows);
    }

    // POST /api/logout
    if (url.includes("/api/logout") && method === "POST") {
      return res.status(200).json({ ok: true });
    }

    // POST /api/agent/chat
    if (url.includes("/api/agent/chat") && method === "POST") {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey || apiKey === "sk-placeholder") {
        return res.json({ message: "🔑 Agent requires an Anthropic API key to be configured. Contact your admin to set ANTHROPIC_API_KEY." });
      }

      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const userId = payload.userId;
      const { message: userMessage, history, action: confirmedAction } = req.body || {};

      // Handle confirmed actions
      if (userMessage === "__confirm_action__" && confirmedAction) {
        try {
          let result: any = { ok: true };
          const p = confirmedAction.params || {};
          switch (confirmedAction.action) {
            case "update_budget":
              await db.query(
                `INSERT INTO budget_grid (user_id, category, month, value, updated_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (user_id, category, month) DO UPDATE SET value = $4, updated_at = NOW()`,
                [userId, p.category, p.month, p.value]
              );
              result = { updated: true, ...p };
              break;
            case "add_investment":
              await db.query(
                `INSERT INTO investments (user_id, name, type, cost_basis, current_value, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                [userId, p.name, p.type || "other", p.cost_basis || 0, p.current_value || p.cost_basis || 0]
              );
              result = { added: true, ...p };
              break;
            case "update_investment":
              await db.query(`UPDATE investments SET current_value = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`, [p.current_value, p.id, userId]);
              result = { updated: true, ...p };
              break;
            case "add_liability":
              await db.query(
                `INSERT INTO liabilities (user_id, name, type, original_amount, current_balance, interest_rate, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                [userId, p.name, p.type || "other", p.original_amount || 0, p.current_balance || p.original_amount || 0, p.interest_rate || 0]
              );
              result = { added: true, ...p };
              break;
            case "update_liability":
              await db.query(`UPDATE liabilities SET current_balance = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`, [p.current_balance, p.id, userId]);
              result = { updated: true, ...p };
              break;
            default:
              return res.json({ message: "Unknown action type." });
          }
          return res.json({ message: `✅ Done! ${confirmedAction.action} executed successfully.`, data: result });
        } catch (err: any) {
          return res.json({ message: `❌ Failed to execute action: ${err.message}` });
        }
      }

      // Gather user data for context
      const [invRes, liabRes, budgetRes, summaryInv, summaryLiab] = await Promise.all([
        db.query("SELECT id, name, type, cost_basis, current_value FROM investments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [userId]),
        db.query("SELECT id, name, type, original_amount, current_balance, interest_rate FROM liabilities WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [userId]),
        db.query("SELECT category, month, value FROM budget_grid WHERE user_id = $1 ORDER BY category, month LIMIT 200", [userId]),
        db.query("SELECT * FROM investments WHERE user_id = $1", [userId]),
        db.query("SELECT * FROM liabilities WHERE user_id = $1", [userId]),
      ]);

      const totalAssets = summaryInv.rows.reduce((s: number, r: any) => s + parseFloat(r.current_value || r.cost_basis || 0), 0);
      const totalLiabilities = summaryLiab.rows.reduce((s: number, r: any) => s + parseFloat(r.current_balance || r.original_amount || 0), 0);

      const dataSummary = `
## Portfolio Summary
- Total Assets: $${totalAssets.toLocaleString()}
- Total Liabilities: $${totalLiabilities.toLocaleString()}
- Net Worth: $${(totalAssets - totalLiabilities).toLocaleString()}

## Investments (${invRes.rows.length})
${invRes.rows.map((r: any) => `- [ID:${r.id}] ${r.name} (${r.type}): cost $${r.cost_basis}, current $${r.current_value}`).join("\n") || "None"}

## Liabilities (${liabRes.rows.length})
${liabRes.rows.map((r: any) => `- [ID:${r.id}] ${r.name} (${r.type}): original $${r.original_amount}, balance $${r.current_balance}, rate ${r.interest_rate}%`).join("\n") || "None"}

## Budget Grid (${budgetRes.rows.length} cells)
${budgetRes.rows.slice(0, 50).map((r: any) => `- ${r.category} | ${r.month}: $${r.value}`).join("\n") || "None"}`;

      const systemPrompt = `You are Sonata, a friendly and concise financial assistant embedded in the Sonata Finance app. You help manage the user's personal finances.

You can view and modify their budget, investments, liabilities, and subscriptions.

Current user data:
${dataSummary}

RULES:
- For read/query questions, answer directly using the data above. Be concise.
- For write/modification requests, respond with a friendly confirmation message AND include exactly one JSON action block on its own line, wrapped in \`\`\`json ... \`\`\` fences.
- Available actions and their params:
  - update_budget: { "action": "update_budget", "params": { "month": "Mar '26", "category": "Rent", "value": 4500 } }
  - add_investment: { "action": "add_investment", "params": { "name": "AAPL", "type": "stock", "cost_basis": 10000, "current_value": 12000 } }
  - update_investment: { "action": "update_investment", "params": { "id": 123, "current_value": 15000 } }
  - add_liability: { "action": "add_liability", "params": { "name": "Car Loan", "type": "loan", "original_amount": 25000, "current_balance": 20000, "interest_rate": 5.5 } }
  - update_liability: { "action": "update_liability", "params": { "id": 456, "current_balance": 18000 } }
- Only include an action block when the user is requesting a change. For queries, just respond with text.
- Keep responses short and helpful. Use $ formatting for money.`;

      const claudeMessages = (history || []).slice(-10).map((m: any) => ({ role: m.role, content: m.content }));
      if (!claudeMessages.length || claudeMessages[claudeMessages.length - 1]?.content !== userMessage) {
        claudeMessages.push({ role: "user", content: userMessage });
      }

      try {
        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1024, system: systemPrompt, messages: claudeMessages }),
        });
        const claudeData = await claudeRes.json();
        if (claudeData.error) {
          return res.json({ message: `⚠️ AI error: ${claudeData.error.message || JSON.stringify(claudeData.error)}` });
        }

        const text = claudeData.content?.[0]?.text || "I couldn't generate a response.";

        // Parse action block if present
        const actionMatch = text.match(/```json\s*\n?([\s\S]*?)\n?```/);
        let action = null;
        let cleanText = text;
        if (actionMatch) {
          try {
            action = JSON.parse(actionMatch[1]);
            cleanText = text.replace(/```json\s*\n?[\s\S]*?\n?```/, "").trim();
          } catch {}
        }

        // Check if response references data the user might want to see
        let data = null;
        const lowerMsg = userMessage.toLowerCase();
        if (lowerMsg.includes("investment")) data = invRes.rows;
        else if (lowerMsg.includes("liabilit") || lowerMsg.includes("debt") || lowerMsg.includes("loan")) data = liabRes.rows;
        else if (lowerMsg.includes("budget")) {
          // Convert budget grid to more readable format
          const grid: Record<string, Record<string, number>> = {};
          for (const r of budgetRes.rows as any[]) {
            if (!grid[r.category]) grid[r.category] = {};
            grid[r.category][r.month] = parseFloat(r.value);
          }
          data = Object.entries(grid).map(([cat, months]) => ({ category: cat, ...months }));
        } else if (lowerMsg.includes("summary") || lowerMsg.includes("net worth") || lowerMsg.includes("overview")) {
          data = { totalAssets: `$${totalAssets.toLocaleString()}`, totalLiabilities: `$${totalLiabilities.toLocaleString()}`, netWorth: `$${(totalAssets - totalLiabilities).toLocaleString()}` };
        }

        return res.json({ message: cleanText, data, action });
      } catch (err: any) {
        return res.json({ message: `⚠️ Failed to reach AI service: ${err.message}` });
      }
    }

    return res.status(404).json({ error: "Not found", path: url });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
