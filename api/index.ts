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
      
      // If email is provided, check if another user already has it
      // If so, merge: transfer this user's wallet to the existing account
      if (email) {
        const existing = await db.query("SELECT * FROM users WHERE email = $1 AND id != $2", [email, payload.userId]);
        if (existing.rows[0]) {
          // Merge: update the existing user with the current wallet, delete the new duplicate
          const currentUser = await db.query("SELECT wallet_address FROM users WHERE id = $1", [payload.userId]);
          if (currentUser.rows[0]?.wallet_address) {
            await db.query("UPDATE users SET wallet_address = $1, updated_at = NOW() WHERE id = $2", 
              [currentUser.rows[0].wallet_address, existing.rows[0].id]);
          }
          // Update name if provided
          if (name) {
            await db.query("UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2", [name, existing.rows[0].id]);
          }
          // Delete the duplicate
          await db.query("DELETE FROM users WHERE id = $1", [payload.userId]);
          // Return the merged user with a new token
          const merged = await db.query("SELECT * FROM users WHERE id = $1", [existing.rows[0].id]);
          const crypto = await import("crypto");
          const newToken = Buffer.from(JSON.stringify({ userId: existing.rows[0].id, t: Date.now() })).toString("base64url") + "." + crypto.randomBytes(48).toString("hex");
          const { password: pw, ...safeMerged } = merged.rows[0];
          return res.json({ ...safeMerged, _newToken: newToken });
        }
      }
      
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
      const totalAssets = investments.rows.reduce((sum: number, inv: any) => sum + (parseFloat(inv.price || 0) * parseFloat(inv.quantity || 0)), 0);
      const totalLiabilities = liabilities.rows.reduce((sum: number, l: any) => sum + parseFloat(l.amount || 0), 0);
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
                `INSERT INTO investments (user_id, symbol, name, type, category, price, quantity, cost_basis, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
                [userId, p.symbol || "", p.name, p.type || "other", p.category || "Other", p.price || 0, p.quantity || 1, p.cost_basis || 0]
              );
              result = { added: true, ...p };
              break;
            case "update_investment":
              await db.query(`UPDATE investments SET price = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`, [p.price, p.id, userId]);
              result = { updated: true, ...p };
              break;
            case "add_liability":
              await db.query(
                `INSERT INTO liabilities (user_id, name, type, amount, interest_rate, minimum_payment, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                [userId, p.name, p.type || "other", p.amount || 0, p.interest_rate || 0, p.minimum_payment || 0]
              );
              result = { added: true, ...p };
              break;
            case "update_liability":
              await db.query(`UPDATE liabilities SET amount = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`, [p.amount, p.id, userId]);
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
      const [invRes, liabRes, budgetRes] = await Promise.all([
        db.query("SELECT id, symbol, name, type, category, price, quantity, cost_basis FROM investments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [userId]),
        db.query("SELECT id, name, type, amount, interest_rate, minimum_payment FROM liabilities WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [userId]),
        db.query("SELECT category, month, value FROM budget_grid WHERE user_id = $1 ORDER BY category, month LIMIT 200", [userId]),
      ]);

      const totalAssets = invRes.rows.reduce((s: number, r: any) => s + (parseFloat(r.price || 0) * parseFloat(r.quantity || 0)), 0);
      const totalLiabilities = liabRes.rows.reduce((s: number, r: any) => s + parseFloat(r.amount || 0), 0);

      const dataSummary = `
## Portfolio Summary
- Total Assets: $${totalAssets.toLocaleString()}
- Total Liabilities: $${totalLiabilities.toLocaleString()}
- Net Worth: $${(totalAssets - totalLiabilities).toLocaleString()}

## Investments (${invRes.rows.length})
${invRes.rows.map((r: any) => `- [ID:${r.id}] ${r.symbol} ${r.name} (${r.type}): ${r.quantity} units @ $${r.price}, cost basis $${r.cost_basis}`).join("\n") || "None"}

## Liabilities (${liabRes.rows.length})
${liabRes.rows.map((r: any) => `- [ID:${r.id}] ${r.name} (${r.type}): $${r.amount}, rate ${r.interest_rate || 0}%`).join("\n") || "None"}

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
  - add_investment: { "action": "add_investment", "params": { "symbol": "AAPL", "name": "Apple Inc", "type": "stock", "category": "Stocks", "price": 150, "quantity": 10, "cost_basis": 1400 } }
  - update_investment: { "action": "update_investment", "params": { "id": 123, "price": 160 } }
  - add_liability: { "action": "add_liability", "params": { "name": "Car Loan", "type": "loan", "amount": 25000, "interest_rate": 5.5, "minimum_payment": 500 } }
  - update_liability: { "action": "update_liability", "params": { "id": 456, "amount": 18000 } }
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

        return res.json({ reply: cleanText, message: cleanText, data, actions: action ? [action] : undefined });
      } catch (err: any) {
        return res.json({ message: `⚠️ Failed to reach AI service: ${err.message}` });
      }
    }

    // POST /api/agent/action — execute a confirmed action
    if (url.includes("/api/agent/action") && method === "POST") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const userId = payload.userId;
      const { action: actionName, params: p } = req.body || {};
      if (!actionName) return res.status(400).json({ error: "action is required" });
      try {
        let result: any = { ok: true };
        switch (actionName) {
          case "update_budget":
            await db.query(
              `INSERT INTO budget_grid (user_id, category, month, value, updated_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (user_id, category, month) DO UPDATE SET value = $4, updated_at = NOW()`,
              [userId, p.category, p.month, p.value]
            );
            result = { updated: true, ...p };
            break;
          case "add_investment":
            await db.query(
              `INSERT INTO investments (user_id, symbol, name, type, category, price, quantity, cost_basis, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
              [userId, p.symbol || "", p.name, p.type || "other", p.category || "Other", p.price || 0, p.quantity || 1, p.cost_basis || 0]
            );
            result = { added: true, ...p };
            break;
          case "update_investment":
            await db.query(`UPDATE investments SET price = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`, [p.price, p.id, userId]);
            result = { updated: true, ...p };
            break;
          case "add_liability":
            await db.query(
              `INSERT INTO liabilities (user_id, name, type, amount, interest_rate, minimum_payment, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
              [userId, p.name, p.type || "other", p.amount || 0, p.interest_rate || 0, p.minimum_payment || 0]
            );
            result = { added: true, ...p };
            break;
          case "update_liability":
            await db.query(`UPDATE liabilities SET amount = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`, [p.amount, p.id, userId]);
            result = { updated: true, ...p };
            break;
          case "add_subscription":
            await db.query(
              `INSERT INTO subscriptions (user_id, name, category, amount, due_date, frequency, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
              [userId, p.name, p.category || "Subscriptions", p.amount || 0, p.due_date || null, p.frequency || "monthly"]
            );
            result = { added: true, ...p };
            break;
          case "delete_subscription":
            await db.query(`DELETE FROM subscriptions WHERE id = $1 AND user_id = $2`, [p.id, userId]);
            result = { deleted: true, ...p };
            break;
          default:
            return res.status(400).json({ error: `Unknown action: ${actionName}` });
        }
        return res.json({ ok: true, action: actionName, result });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }

    // GET /api/subscriptions
    if (url.match(/\/api\/subscriptions\/?$/) && method === "GET") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const result = await db.query("SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY category, name", [payload.userId]);
      return res.json(result.rows);
    }

    // POST /api/subscriptions
    if (url.match(/\/api\/subscriptions\/?$/) && method === "POST") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const { name, category, amount, due_date, frequency } = req.body || {};
      if (!name) return res.status(400).json({ error: "name is required" });
      const result = await db.query(
        `INSERT INTO subscriptions (user_id, name, category, amount, due_date, frequency, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
        [payload.userId, name, category || "Subscriptions", amount || 0, due_date || null, frequency || "monthly"]
      );
      return res.json(result.rows[0]);
    }

    // DELETE /api/subscriptions/:id
    if (url.match(/\/api\/subscriptions\/\d+/) && method === "DELETE") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const id = url.match(/\/api\/subscriptions\/(\d+)/)?.[1];
      await db.query("DELETE FROM subscriptions WHERE id = $1 AND user_id = $2", [id, payload.userId]);
      return res.json({ ok: true });
    }

    // POST /api/investments
    if (url.match(/\/api\/investments\/?$/) && method === "POST") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const { symbol, name, type, category, price, quantity, cost_basis, entity, notes } = req.body || {};
      if (!name) return res.status(400).json({ error: "name is required" });
      const result = await db.query(
        `INSERT INTO investments (user_id, symbol, name, type, category, price, quantity, cost_basis, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *`,
        [payload.userId, symbol || "", name, type || "other", category || "Other", price || 0, quantity || 1, cost_basis || 0, notes || null]
      );
      return res.json(result.rows[0]);
    }

    // POST /api/liabilities
    if (url.match(/\/api\/liabilities\/?$/) && method === "POST") {
      const payload = auth();
      if (!payload) return res.status(401).json({ error: "Not authenticated" });
      const { name, type, amount, interest_rate, minimum_payment, due_date, notes } = req.body || {};
      if (!name) return res.status(400).json({ error: "name is required" });
      const result = await db.query(
        `INSERT INTO liabilities (user_id, name, type, amount, interest_rate, minimum_payment, due_date, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
        [payload.userId, name, type || "other", amount || 0, interest_rate || 0, minimum_payment || 0, due_date || null, notes || null]
      );
      return res.json(result.rows[0]);
    }

    return res.status(404).json({ error: "Not found", path: url });
  } catch (error: any) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
