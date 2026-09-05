import { db } from "./src/config/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_token varchar(64) UNIQUE;`);
    console.log("✅ Successfully added calendar_token column to users table");
  } catch (err) {
    console.error("❌ Migration error:", err);
  }
  process.exit(0);
}

main();
