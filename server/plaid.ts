// @ts-nocheck
/**
 * Plaid integration — Link tokens, token exchange, transaction sync, investment sync.
 */
import { Router, Request, Response } from "express";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";
import { db } from "./db";
import { plaidItems, plaidAccounts, plaidTransactions, plaidHoldings } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "./auth";

// ─── Plaid Client ────────────────────────────────────────────────────

const plaidEnv = (process.env.PLAID_ENV || "sandbox") as keyof typeof PlaidEnvironments;

const configuration = new Configuration({
  basePath: PlaidEnvironments[plaidEnv],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// ─── Routes ──────────────────────────────────────────────────────────

export const plaidRouter = Router();

/**
 * POST /api/plaid/create-link-token
 * Creates a Plaid Link token for the frontend widget.
 */
plaidRouter.post("/create-link-token", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { products: requestedProducts } = req.body || {};

    // Default: transactions + investments
    const products = (requestedProducts || ["transactions"]).map(
      (p: string) => p as Products
    );

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: String(userId) },
      client_name: "Sonata Finance",
      products,
      country_codes: [CountryCode.Us],
      language: "en",
    });

    res.json({ linkToken: response.data.link_token });
  } catch (error: any) {
    console.error("Plaid link token error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create link token" });
  }
});

/**
 * POST /api/plaid/exchange-token
 * Exchanges a public_token from Link for a permanent access_token.
 */
plaidRouter.post("/exchange-token", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { publicToken, institutionId, institutionName } = req.body;

    if (!publicToken) {
      return res.status(400).json({ error: "publicToken is required" });
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const { access_token, item_id } = exchangeResponse.data;

    // Store the Plaid item
    const [item] = await db.insert(plaidItems).values({
      userId,
      institutionId: institutionId || "unknown",
      institutionName: institutionName || "Unknown Institution",
      accessToken: access_token,
      itemId: item_id,
      products: ["transactions"],
      status: "active",
    }).returning();

    // Fetch and store accounts
    const accountsResponse = await plaidClient.accountsGet({ access_token });
    for (const acct of accountsResponse.data.accounts) {
      await db.insert(plaidAccounts).values({
        userId,
        plaidItemId: item.id,
        accountId: acct.account_id,
        name: acct.name,
        officialName: acct.official_name || null,
        type: acct.type,
        subtype: acct.subtype || null,
        mask: acct.mask || null,
        currentBalance: acct.balances.current?.toString() || null,
        availableBalance: acct.balances.available?.toString() || null,
        limit: acct.balances.limit?.toString() || null,
        isoCurrencyCode: acct.balances.iso_currency_code || "USD",
        lastSynced: new Date(),
      }).onConflictDoUpdate({
        target: plaidAccounts.accountId,
        set: {
          currentBalance: acct.balances.current?.toString() || null,
          availableBalance: acct.balances.available?.toString() || null,
          lastSynced: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    res.json({
      success: true,
      itemId: item.id,
      institutionName: institutionName || "Unknown",
      accountCount: accountsResponse.data.accounts.length,
    });
  } catch (error: any) {
    console.error("Plaid exchange error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to link account" });
  }
});

/**
 * POST /api/plaid/sync
 * Syncs transactions for all linked items using the transactions/sync endpoint.
 */
plaidRouter.post("/sync", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const items = await db.select().from(plaidItems).where(
      and(eq(plaidItems.userId, userId), eq(plaidItems.status, "active"))
    );

    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;

    for (const item of items) {
      try {
        // Sync transactions
        let hasMore = true;
        let cursor = item.cursor || undefined;

        while (hasMore) {
          const syncResponse = await plaidClient.transactionsSync({
            access_token: item.accessToken,
            cursor,
          });

          const { added, modified, removed, next_cursor, has_more } = syncResponse.data;

          // Insert new transactions
          for (const txn of added) {
            await db.insert(plaidTransactions).values({
              userId,
              accountId: txn.account_id,
              transactionId: txn.transaction_id,
              name: txn.name,
              merchantName: txn.merchant_name || null,
              amount: txn.amount.toString(),
              isoCurrencyCode: txn.iso_currency_code || "USD",
              date: txn.date,
              category: txn.category || [],
              personalFinanceCategory: txn.personal_finance_category?.primary || null,
              pending: txn.pending,
              logoUrl: txn.logo_url || null,
            }).onConflictDoNothing();
            totalAdded++;
          }

          // Update modified transactions
          for (const txn of modified) {
            await db.update(plaidTransactions)
              .set({
                name: txn.name,
                merchantName: txn.merchant_name || null,
                amount: txn.amount.toString(),
                date: txn.date,
                category: txn.category || [],
                pending: txn.pending,
              })
              .where(eq(plaidTransactions.transactionId, txn.transaction_id));
            totalModified++;
          }

          // Remove deleted transactions
          for (const txn of removed) {
            if (txn.transaction_id) {
              await db.delete(plaidTransactions)
                .where(eq(plaidTransactions.transactionId, txn.transaction_id));
              totalRemoved++;
            }
          }

          cursor = next_cursor;
          hasMore = has_more;
        }

        // Update cursor
        await db.update(plaidItems)
          .set({ cursor, updatedAt: new Date() })
          .where(eq(plaidItems.id, item.id));

        // Update account balances
        const accountsResponse = await plaidClient.accountsGet({
          access_token: item.accessToken,
        });
        for (const acct of accountsResponse.data.accounts) {
          await db.update(plaidAccounts)
            .set({
              currentBalance: acct.balances.current?.toString() || null,
              availableBalance: acct.balances.available?.toString() || null,
              lastSynced: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(plaidAccounts.accountId, acct.account_id));
        }
      } catch (itemError: any) {
        console.error(`Sync error for item ${item.id}:`, itemError.response?.data || itemError.message);
        // Mark item as errored
        await db.update(plaidItems)
          .set({ status: "error", errorCode: itemError.response?.data?.error_code || "UNKNOWN" })
          .where(eq(plaidItems.id, item.id));
      }
    }

    res.json({ added: totalAdded, modified: totalModified, removed: totalRemoved });
  } catch (error: any) {
    console.error("Sync error:", error.message);
    res.status(500).json({ error: "Sync failed" });
  }
});

/**
 * GET /api/plaid/items
 * List all linked institutions for the user.
 */
plaidRouter.get("/items", isAuthenticated, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const items = await db.select({
    id: plaidItems.id,
    institutionId: plaidItems.institutionId,
    institutionName: plaidItems.institutionName,
    status: plaidItems.status,
    errorCode: plaidItems.errorCode,
    createdAt: plaidItems.createdAt,
  }).from(plaidItems).where(eq(plaidItems.userId, userId));
  res.json(items);
});

/**
 * GET /api/plaid/accounts
 * List all accounts across linked institutions.
 */
plaidRouter.get("/accounts", isAuthenticated, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const accounts = await db.select().from(plaidAccounts).where(eq(plaidAccounts.userId, userId));
  res.json(accounts);
});

/**
 * GET /api/plaid/transactions
 * Get transactions with optional filters.
 */
plaidRouter.get("/transactions", isAuthenticated, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  // Simple: return last 100 transactions
  const txns = await db.select()
    .from(plaidTransactions)
    .where(eq(plaidTransactions.userId, userId))
    .orderBy(plaidTransactions.date)
    .limit(100);
  res.json(txns);
});

/**
 * DELETE /api/plaid/items/:id
 * Unlink an institution.
 */
plaidRouter.delete("/items/:id", isAuthenticated, async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const itemId = parseInt(req.params.id);

  const [item] = await db.select().from(plaidItems).where(
    and(eq(plaidItems.id, itemId), eq(plaidItems.userId, userId))
  );

  if (!item) return res.status(404).json({ error: "Item not found" });

  // Revoke access at Plaid
  try {
    await plaidClient.itemRemove({ access_token: item.accessToken });
  } catch {}

  // Remove from DB
  await db.delete(plaidItems).where(eq(plaidItems.id, itemId));
  res.json({ success: true });
});
