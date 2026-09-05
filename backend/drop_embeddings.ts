import { sql } from "drizzle-orm";
import { db } from "./src/config/db";

async function dropTable() {
  console.log("Dropping task_embeddings...");
  await db.execute(sql`DROP TABLE IF EXISTS task_embeddings CASCADE`);
  console.log("Table dropped.");
  process.exit(0);
}

dropTable();
