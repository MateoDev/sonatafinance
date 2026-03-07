// @ts-nocheck
/**
 * Agent chat endpoint — Claude-powered financial assistant.
 * Reads user's portfolio data, answers questions, proposes DB writes with confirmation flow.
 */
import { Router, Request, Response } from "express";
import { db } from "./db";
import { investments, liabilities, plaidAccounts, plaidTransactions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "./auth";

export const agentRouter = Router();

agentRouter.post("/chat", isAuthenticated, async (req: Request, res: Response) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "sk-placeholder") {
    return res.json({ message: "🔑 Agent requires an Anthropic API key. Set ANTHROPIC_API_KEY." });
  }

  const userId = (req as any).user.id;
  const { message: userMessage, history, action: confirmedAction } = req.body || {};

  if (!userMessage) {
    return res.status(400).json({ error: "message is required" });
  }

  // ─── Handle confirmed actions ────────────────────────────────────
  if (userMessage === "__confirm_action__" && confirmedAction) {
    try {
      let result: any = { ok: true };
      const p = confirmedAction.params || {};
      const pool = (await import("./db")).pool;

      switch (confirmedAction.action) {
        case "update_budget":
          await pool.query(
            `INSERT INTO budget_items (user_id, category, month, amount, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT (user_id, category, month) DO UPDATE SET amount = $4, updated_at = NOW()`,
            [userId, p.category, p.month, p.value]
          );
          result = { updated: true, ...p };
          break;
        case "add_investment":
          await pool.query(
            `INSERT INTO investments (user_id, name, symbol, type, category, price, quantity, cost_basis, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
            [userId, p.name, p.symbol || "", p.type || "Other", p.category || null, p.price || 0, p.quantity || 0, p.cost_basis || 0]
          );
          result = { added: true, ...p };
          break;
        case "update_investment":
          await pool.query(
            `UPDATE investments SET price = COALESCE($1, price), quantity = COALESCE($2, quantity), updated_at = NOW() WHERE id = $3 AND user_id = $4`,
            [p.price || null, p.quantity || null, p.id, userId]
          );
          result = { updated: true, ...p };
          break;
        case "add_liability":
          await pool.query(
            `INSERT INTO liabilities (user_id, name, type, amount, interest_rate, minimum_payment, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
            [userId, p.name, p.type || "Other", p.amount || 0, p.interest_rate || 0, p.minimum_payment || 0]
          );
          result = { added: true, ...p };
          break;
        case "update_liability":
          await pool.query(
            `UPDATE liabilities SET amount = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`,
            [p.amount, p.id, userId]
          );
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

  // ─── Gather user data for context ────────────────────────────────
  const pool = (await import("./db")).pool;

  const [invRes, liabRes, budgetRes, plaidAcctRes, plaidTxnRes] = await Promise.all([
    pool.query("SELECT id, name, symbol, type, category, price, quantity, cost_basis FROM investments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [userId]),
    pool.query("SELECT id, name, type, amount, interest_rate, minimum_payment, is_completed FROM liabilities WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50", [userId]),
    pool.query("SELECT category, name, amount, actual, date, is_recurring FROM budget_items WHERE user_id = $1 ORDER BY date DESC LIMIT 100", [userId]),
    pool.query("SELECT name, type, subtype, current_balance, available_balance FROM plaid_accounts WHERE user_id = $1", [userId]),
    pool.query("SELECT name, merchant_name, amount, date, personal_finance_category FROM plaid_transactions WHERE user_id = $1 ORDER BY date DESC LIMIT 30", [userId]),
  ]);

  const totalAssets = invRes.rows.reduce((s: number, r: any) => s + (parseFloat(r.price || 0) * parseFloat(r.quantity || 0)), 0);
  const totalLiabilities = liabRes.rows.filter((r: any) => !r.is_completed).reduce((s: number, r: any) => s + parseFloat(r.amount || 0), 0);

  const dataSummary = `
## Portfolio Summary
- Total Assets: $${totalAssets.toLocaleString()}
- Total Liabilities: $${totalLiabilities.toLocaleString()}
- Net Worth: $${(totalAssets - totalLiabilities).toLocaleString()}

## Investments (${invRes.rows.length})
${invRes.rows.map((r: any) => `- [ID:${r.id}] ${r.name} (${r.symbol}, ${r.type}${r.category ? '/' + r.category : ''}): ${r.quantity} @ $${r.price}, cost basis $${r.cost_basis}`).join("\n") || "None"}

## Liabilities (${liabRes.rows.length})
${liabRes.rows.map((r: any) => `- [ID:${r.id}] ${r.name} (${r.type}): $${r.amount}, rate ${r.interest_rate || 0}%, min payment $${r.minimum_payment || 0}${r.is_completed ? ' [PAID]' : ''}`).join("\n") || "None"}

## Budget (${budgetRes.rows.length} items)
${budgetRes.rows.slice(0, 50).map((r: any) => `- ${r.category} | ${r.name}: budgeted $${r.amount}, actual $${r.actual || 0}${r.is_recurring ? ' (recurring)' : ''}`).join("\n") || "None"}

## Bank Accounts (Plaid) (${plaidAcctRes.rows.length})
${plaidAcctRes.rows.map((r: any) => `- ${r.name} (${r.type}/${r.subtype}): balance $${r.current_balance}, available $${r.available_balance}`).join("\n") || "None linked"}

## Recent Transactions (${plaidTxnRes.rows.length})
${plaidTxnRes.rows.slice(0, 20).map((r: any) => `- ${r.date} | ${r.merchant_name || r.name}: $${r.amount} [${r.personal_finance_category || 'uncategorized'}]`).join("\n") || "None"}`;

  const systemPrompt = `You are Sonata, a friendly and concise financial assistant embedded in the Sonata Finance app. You help manage the user's personal finances.

You can view and modify their budget, investments, liabilities, and bank accounts (via Plaid).

Current user data:
${dataSummary}

RULES:
- For read/query questions, answer directly using the data above. Be concise.
- For write/modification requests, respond with a friendly confirmation message AND include exactly one JSON action block on its own line, wrapped in \`\`\`json ... \`\`\` fences.
- Available actions and their params:
  - update_budget: { "action": "update_budget", "params": { "month": "Mar '26", "category": "Rent", "value": 4500 } }
  - add_investment: { "action": "add_investment", "params": { "name": "Apple Inc", "symbol": "AAPL", "type": "Stock", "category": "Stocks/Bonds/ETFs", "price": 180, "quantity": 50, "cost_basis": 8500 } }
  - update_investment: { "action": "update_investment", "params": { "id": 123, "price": 195, "quantity": 50 } }
  - add_liability: { "action": "add_liability", "params": { "name": "Car Loan", "type": "Auto Loan", "amount": 25000, "interest_rate": 5.5, "minimum_payment": 450 } }
  - update_liability: { "action": "update_liability", "params": { "id": 456, "amount": 18000 } }
- Only include an action block when the user is requesting a change. For queries, just respond with text.
- Keep responses short and helpful. Use $ formatting for money.`;

  // Build messages
  const claudeMessages = (history || []).slice(-10).map((m: any) => ({ role: m.role, content: m.content }));
  if (!claudeMessages.length || claudeMessages[claudeMessages.length - 1]?.content !== userMessage) {
    claudeMessages.push({ role: "user", content: userMessage });
  }

  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages,
      }),
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

    // Attach relevant data based on query type
    let data = null;
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes("investment")) data = invRes.rows;
    else if (lowerMsg.includes("liabilit") || lowerMsg.includes("debt") || lowerMsg.includes("loan")) data = liabRes.rows;
    else if (lowerMsg.includes("budget")) {
      const grid: Record<string, Record<string, number>> = {};
      for (const r of budgetRes.rows as any[]) {
        if (!grid[r.category]) grid[r.category] = {};
        grid[r.category][r.month] = parseFloat(r.amount);
      }
      data = Object.entries(grid).map(([cat, months]) => ({ category: cat, ...months }));
    } else if (lowerMsg.includes("transaction")) data = plaidTxnRes.rows;
    else if (lowerMsg.includes("account") || lowerMsg.includes("bank") || lowerMsg.includes("balance")) data = plaidAcctRes.rows;
    else if (lowerMsg.includes("summary") || lowerMsg.includes("net worth") || lowerMsg.includes("overview")) {
      data = { totalAssets: `$${totalAssets.toLocaleString()}`, totalLiabilities: `$${totalLiabilities.toLocaleString()}`, netWorth: `$${(totalAssets - totalLiabilities).toLocaleString()}` };
    }

    return res.json({ message: cleanText, data, action });
  } catch (err: any) {
    return res.json({ message: `⚠️ Failed to reach AI service: ${err.message}` });
  }
});
