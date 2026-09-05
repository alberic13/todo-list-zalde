import { sql } from "drizzle-orm";
import { db } from "./src/config/db";

async function recreateTable() {
  console.log("Recreating task_embeddings...");
  await db.execute(sql`
CREATE TABLE IF NOT EXISTS "task_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"embedding" vector(768) NOT NULL,
	"content_chunk" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_embeddings_task_id_unique" UNIQUE("task_id")
);
  `);
  
  await db.execute(sql`
ALTER TABLE "task_embeddings" ADD CONSTRAINT "task_embeddings_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
  `);
  
  await db.execute(sql`
ALTER TABLE "task_embeddings" ADD CONSTRAINT "task_embeddings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  `);

  await db.execute(sql`
CREATE INDEX IF NOT EXISTS "task_embeddings_user_idx" ON "task_embeddings" USING btree ("user_id");
  `);

  await db.execute(sql`
CREATE INDEX IF NOT EXISTS "task_embeddings_task_idx" ON "task_embeddings" USING btree ("task_id");
  `);

  await db.execute(sql`
CREATE INDEX IF NOT EXISTS "task_embeddings_embedding_idx" ON "task_embeddings" USING hnsw ("embedding" vector_cosine_ops);
  `);

  console.log("Table created.");
  process.exit(0);
}

recreateTable();
