import { db } from "./src/config/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("Migrating database for Email Verification Tokens and is_verified column...");

  try {
    // 1. Add is_verified column to users table if not exists
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE NOT NULL;
    `);
    console.log("✓ Column 'is_verified' added to 'users' table.");

    // 2. Set existing users to is_verified = true so existing accounts are not locked out
    await db.execute(sql`
      UPDATE users SET is_verified = TRUE WHERE is_verified IS FALSE;
    `);
    console.log("✓ Existing users marked as verified.");

    // 3. Create email_verification_tokens table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(10) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✓ Table 'email_verification_tokens' created.");

    // 4. Create indices
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS email_verification_user_idx ON email_verification_tokens (user_id);
      CREATE INDEX IF NOT EXISTS email_verification_token_idx ON email_verification_tokens (token);
    `);
    console.log("✓ Indices created successfully.");

    console.log("🎉 Email verification migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
