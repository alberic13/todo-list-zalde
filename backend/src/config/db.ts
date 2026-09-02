import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../models/schema";
import { env } from "./env";

const connectionString = env.DATABASE_URL;

// PostgreSQL client configured for transaction safety and pooling
export const sql = postgres(connectionString, {
  max: env.NODE_ENV === "production" ? 10 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Recommended for serverless/pooled Neon connections
});

export const db = drizzle(sql, { schema });
