import { db } from "./src/config/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Migrating collaboration tables & columns...");
  try {
    // 1. Add invite_code to tasks
    await db.execute(sql`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS invite_code varchar(32) UNIQUE;`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS task_invite_code_idx ON tasks(invite_code);`);
    console.log("✅ Column tasks.invite_code and index ready");

    // 2. Create task_collaborators table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS task_collaborators (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role varchar(20) NOT NULL DEFAULT 'collaborator',
        joined_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS task_collab_task_idx ON task_collaborators(task_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS task_collab_user_idx ON task_collaborators(user_id);`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS task_collab_task_user_idx ON task_collaborators(task_id, user_id);`);
    console.log("✅ Table task_collaborators and indexes ready");

    // 3. Create task_messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS task_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content text NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS task_msg_task_idx ON task_messages(task_id);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS task_msg_created_idx ON task_messages(created_at);`);
    console.log("✅ Table task_messages and indexes ready");

    console.log("🎉 Collaboration database migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration error:", err);
  }
  process.exit(0);
}

main();
