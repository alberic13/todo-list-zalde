import { eq } from "drizzle-orm";
import { db, sql } from "../config/db";
import { users, categories, tasks, subtasks } from "../models/schema";
import { EmbeddingService } from "../services/embedding.service";

async function seed() {
  console.log("🌱 Memulai proses seeding database...");

  try {
    // 1. Setup Demo User
    const demoEmail = "demo@zalde.com";
    const demoPassword = "Password123!";
    let user = await db.query.users.findFirst({
      where: eq(users.email, demoEmail),
    });

    if (!user) {
      const passwordHash = await Bun.password.hash(demoPassword, {
        algorithm: "argon2id",
        memoryCost: 65536,
        timeCost: 2,
      });

      const [created] = await db
        .insert(users)
        .values({
          name: "Alex Zalde",
          email: demoEmail,
          passwordHash,
        })
        .returning();

      user = created;
      console.log(`✅ User dibuat: ${user.email} (Password: ${demoPassword})`);
    } else {
      console.log(`ℹ️ User sudah ada: ${user.email}`);
    }

    const userId = user.id;

    // 2. Clean existing user tasks & categories for fresh dummy seed
    await db.delete(tasks).where(eq(tasks.userId, userId));
    await db.delete(categories).where(eq(categories.userId, userId));

    // 3. Insert Categories
    const categoryData = [
      { name: "Work & Project", colorHex: "#6366f1" },
      { name: "Personal & Health", colorHex: "#10b981" },
      { name: "Learning & AI", colorHex: "#f59e0b" },
      { name: "Finance", colorHex: "#ec4899" },
    ];

    const insertedCategories = await db
      .insert(categories)
      .values(
        categoryData.map((c) => ({
          userId,
          name: c.name,
          colorHex: c.colorHex,
        }))
      )
      .returning();

    console.log(`✅ ${insertedCategories.length} Kategori berhasil dibuat.`);

    const getCatId = (name: string) =>
      insertedCategories.find((c) => c.name === name)?.id;

    // 4. Insert Dummy Tasks & Subtasks
    const taskData = [
      {
        title: "Integrasi Payment Gateway Stripe & Midtrans",
        description: "Setup webhook, handle idempotency key, dan integrasi recurring subscription.",
        categoryId: getCatId("Work & Project"),
        status: "todo",
        priority: "urgent",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 hari
        subtasks: [
          { title: "Daftar akun sandbox dan dapatkan API keys", isCompleted: true },
          { title: "Buat endpoint webhook receiver dengan signature check", isCompleted: false },
          { title: "Uji coba pembayaran kartu kredit & QRIS", isCompleted: false },
        ],
      },
      {
        title: "Optimasi Query Database & Indexing pgvector",
        description: "Benchmark query latency dan pasang HNSW index pada tabel task_embeddings.",
        categoryId: getCatId("Work & Project"),
        status: "in_progress",
        priority: "high",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 hari
        subtasks: [
          { title: "Analisis slow query dengan EXPLAIN ANALYZE", isCompleted: true },
          { title: "Tuning connection pool pada postgres client", isCompleted: true },
          { title: "Testing load 500 concurrent semantic search requests", isCompleted: false },
        ],
      },
      {
        title: "Desain UI/UX Dashboard Todo List Glassmorphism",
        description: "Implementasi desain modern Tailwind CSS v4, smooth animations, dan responsive layout.",
        categoryId: getCatId("Work & Project"),
        status: "done",
        priority: "medium",
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Kemarin
        subtasks: [
          { title: "Riset palet warna HSL dan typography Google Fonts", isCompleted: true },
          { title: "Buat komponen KanbanBoard dan TaskModal", isCompleted: true },
          { title: "Integrasi micro-interactions dan filter bar", isCompleted: true },
        ],
      },
      {
        title: "Eksplorasi Fitur Gemini 2.0 Flash & RAG Pipeline",
        description: "Implementasi context caching dan multi-turn semantic task breakdown.",
        categoryId: getCatId("Learning & AI"),
        status: "in_progress",
        priority: "high",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        subtasks: [
          { title: "Baca dokumentasi resmi Google Gemini API v1beta", isCompleted: true },
          { title: "Buat service embedding text-embedding-004", isCompleted: true },
          { title: "Implementasi cosine similarity search in-memory", isCompleted: true },
          { title: "Integrasi drawer Copilot dengan prompt guardrails", isCompleted: false },
        ],
      },
      {
        title: "Membaca Buku System Design & Cloud Architecture",
        description: "Bab 4-6: Distributed Caching, Message Queues (Kafka), dan Eventual Consistency.",
        categoryId: getCatId("Learning & AI"),
        status: "todo",
        priority: "low",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        subtasks: [
          { title: "Membaca bab Distributed Cache (Redis cluster)", isCompleted: false },
          { title: "Membuat ringkasan mindmap arsitektur", isCompleted: false },
        ],
      },
      {
        title: "Olahraga Pagi & Jogging 5 KM",
        description: "Target pace 6:00 min/km di lintasan Gelora Bung Karno.",
        categoryId: getCatId("Personal & Health"),
        status: "done",
        priority: "medium",
        dueDate: new Date(),
        subtasks: [
          { title: "Pemanasan statis & dinamis 10 menit", isCompleted: true },
          { title: "Lari 5 kilometer non-stop", isCompleted: true },
          { title: "Pendinginan dan rehidrasi elektrolit", isCompleted: true },
        ],
      },
      {
        title: "Medical Checkup & Konsultasi Dokter",
        description: "Pemeriksaan kesehatan rutin tahunan dan tes darah lengkap.",
        categoryId: getCatId("Personal & Health"),
        status: "todo",
        priority: "medium",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        subtasks: [
          { title: "Booking jadwal di klinik mitra", isCompleted: true },
          { title: "Puasa 10 jam sebelum tes darah", isCompleted: false },
        ],
      },
      {
        title: "Review Laporan Keuangan Bulanan & Budgeting Investasi",
        description: "Evaluasi pengeluaran bulanan dan alokasi portofolio reksadana/saham.",
        categoryId: getCatId("Finance"),
        status: "done",
        priority: "high",
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        subtasks: [
          { title: "Rekap mutasi rekening bank dan e-wallet", isCompleted: true },
          { title: "Alokasi dana darurat dan investasi rutin", isCompleted: true },
        ],
      },
    ];

    console.log("📝 Memasukkan task dan subtask...");

    for (let i = 0; i < taskData.length; i++) {
      const t = taskData[i];
      const [insertedTask] = await db
        .insert(tasks)
        .values({
          userId,
          categoryId: t.categoryId,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          orderIndex: i,
        })
        .returning();

      if (t.subtasks && t.subtasks.length > 0) {
        await db.insert(subtasks).values(
          t.subtasks.map((s) => ({
            taskId: insertedTask.id,
            title: s.title,
            isCompleted: s.isCompleted,
          }))
        );
      }

      // Generate vector embedding
      await EmbeddingService.syncTaskEmbedding(insertedTask.id, userId);
    }

    console.log(`✅ ${taskData.length} Task beserta subtask & vector embeddings berhasil dibuat.`);
    console.log("\n✨ Seeding database selesai dengan sukses!");
    console.log("==========================================");
    console.log(`👤 Akun Demo: ${demoEmail}`);
    console.log(`🔑 Password : ${demoPassword}`);
    console.log("==========================================");
  } catch (error) {
    console.error("❌ Gagal melakukan seeding database:", error);
  } finally {
    await sql.end();
    process.exit(0);
  }
}

seed();
