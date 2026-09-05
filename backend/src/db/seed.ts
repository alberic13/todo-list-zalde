import { eq } from "drizzle-orm";
import { db, sql } from "../config/db";
import { users, categories, tasks, subtasks, taskEmbeddings } from "../models/schema";
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

    // 2. Clean existing user tasks, categories & embeddings for fresh dummy seed
    await db.delete(taskEmbeddings).where(eq(taskEmbeddings.userId, userId));
    await db.delete(tasks).where(eq(tasks.userId, userId));
    await db.delete(categories).where(eq(categories.userId, userId));

    // 3. Insert Categories
    const categoryData = [
      { name: "Tugas Kuliah & Skripsi", colorHex: "#6366f1" },
      { name: "Freelance & Coding", colorHex: "#10b981" },
      { name: "Organisasi BEM/HIMA", colorHex: "#f59e0b" },
      { name: "Personal & Keuangan", colorHex: "#ec4899" },
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
        title: "Revisi Bab 1-3 Skripsi (Sistem Pakar AI)",
        description: "Perbaiki latar belakang dan tambah jurnal referensi tahun 2023-2025 sesuai coretan Dospem.",
        categoryId: getCatId("Tugas Kuliah & Skripsi"),
        status: "todo",
        priority: "urgent",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 hari
        subtasks: [
          { title: "Cari 5 jurnal nasional SINTA 2 terbaru", isCompleted: true },
          { title: "Perbaiki rumusan masalah", isCompleted: false },
          { title: "Bimbingan revisi ke ruangan Dospem", isCompleted: false },
        ],
      },
      {
        title: "Selesaikan Modul Auth - Freelance Project Kasir",
        description: "Implementasi JWT Login, Role Based Access (Admin & Kasir), dan integrasi API.",
        categoryId: getCatId("Freelance & Coding"),
        status: "in_progress",
        priority: "high",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 hari
        subtasks: [
          { title: "Setup tabel Users di PostgreSQL", isCompleted: true },
          { title: "Buat endpoint /login & /register", isCompleted: true },
          { title: "Integrasi dengan UI React Frontend", isCompleted: false },
        ],
      },
      {
        title: "Belajar Next.js 14 & Tailwind CSS v4",
        description: "Bikin personal website & portofolio untuk persiapan lamar magang MBKM.",
        categoryId: getCatId("Freelance & Coding"),
        status: "in_progress",
        priority: "medium",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), 
        subtasks: [
          { title: "Tonton tutorial App Router Next.js", isCompleted: true },
          { title: "Desain wireframe portofolio di Figma", isCompleted: true },
          { title: "Slicing UI halaman Home dan Projects", isCompleted: false },
        ],
      },
      {
        title: "Tugas Besar Pemrograman Web Lanjut",
        description: "Membuat aplikasi CRUD menggunakan stack MERN atau T3 Stack. Kelompok 4.",
        categoryId: getCatId("Tugas Kuliah & Skripsi"),
        status: "done",
        priority: "high",
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Kemarin
        subtasks: [
          { title: "Bagi tugas kelompok", isCompleted: true },
          { title: "Koding bagian backend API", isCompleted: true },
          { title: "Deploy ke Vercel & presentasi", isCompleted: true },
        ],
      },
      {
        title: "Rapat Divisi Kominfo Himpunan (HIMA)",
        description: "Bahas desain poster untuk acara Seminar Nasional IT bulan depan.",
        categoryId: getCatId("Organisasi BEM/HIMA"),
        status: "todo",
        priority: "medium",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // +1 hari
        subtasks: [
          { title: "Buat draft timeline publikasi", isCompleted: false },
          { title: "Siapkan 2 alternatif template desain", isCompleted: false },
        ],
      },
      {
        title: "Bayar Uang Kuliah Tunggal (UKT) Semester Akhir",
        description: "Batas pembayaran tanggal 20. Jangan sampai telat agar bisa isi KRS.",
        categoryId: getCatId("Personal & Keuangan"),
        status: "todo",
        priority: "urgent",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        subtasks: [
          { title: "Minta uang UKT ke orang tua / cairkan tabungan", isCompleted: false },
          { title: "Bayar via Virtual Account Bank", isCompleted: false },
          { title: "Cetak bukti bayar & lapor ke BAAK", isCompleted: false },
        ],
      },
      {
        title: "Olahraga Pagi (Jogging Keliling Kampus)",
        description: "Jaga kesehatan biar gak gampang sakit pas lagi banyak tugas.",
        categoryId: getCatId("Personal & Keuangan"),
        status: "done",
        priority: "low",
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        subtasks: [
          { title: "Pemanasan", isCompleted: true },
          { title: "Lari 3 KM", isCompleted: true },
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
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

seed();
