import { db } from "./src/config/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log("Vector extension created successfully");
  } catch (err) {
    console.error("Error creating vector extension:", err);
  }
  process.exit(0);
}
main();
