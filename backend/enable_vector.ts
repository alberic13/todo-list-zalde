import { sql } from "drizzle-orm";
import { db } from "./src/config/db";

async function enableVector() {
  console.log("Enabling pgvector extension...");
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
  console.log("Extension enabled.");
  process.exit(0);
}

enableVector();
