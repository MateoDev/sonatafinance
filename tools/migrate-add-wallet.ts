/**
 * Migration: Add wallet_address column to users table
 * Run with: npx tsx tools/migrate-add-wallet.ts
 */
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Adding wallet_address column to users table...");

  try {
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE
    `);
    console.log("✅ wallet_address column added successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
