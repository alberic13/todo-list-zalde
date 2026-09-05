import { db } from "./src/config/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS password_reset_user_idx ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS password_reset_token_idx ON password_reset_tokens(token);
    `);
    console.log("Successfully created password_reset_tokens table and indexes!");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
  process.exit(0);
}

main();
