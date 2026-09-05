import { db } from "./src/config/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number varchar(50);`);
    console.log("Successfully added phone_number column");
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
main();
