import { db } from "./src/config/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Resetting database schema...");
    await db.execute(sql`DROP SCHEMA public CASCADE;`);
    await db.execute(sql`CREATE SCHEMA public;`);
    await db.execute(sql`GRANT ALL ON SCHEMA public TO postgres;`);
    await db.execute(sql`GRANT ALL ON SCHEMA public TO public;`);
    console.log("Database reset complete! Now run: bun run db:push");
  } catch (err) {
    console.error("Error resetting database:", err);
  }
  process.exit(0);
}
main();
