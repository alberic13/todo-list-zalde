import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { db } from "../config/db";
import { tasks, taskEmbeddings } from "../models/schema";
import { GeminiClient } from "../config/ai";

export class RagService {
  /**
   * Fast vector semantic search directly in PostgreSQL (pgvector HNSW)
   */
  static async semanticSearch(userId: string, query: string, topK = 10) {
    if (!query.trim()) return [];

    // 1. Generate query embedding
    const queryVector = await GeminiClient.generateEmbedding(query);

    // 2. Query Postgres natively for cosine similarity (1 - cosine_distance)
    const similarity = sql<number>`1 - (${taskEmbeddings.embedding} <=> ${JSON.stringify(queryVector)}::vector)`;

    const scoredTasks = await db
      .select({
        taskId: taskEmbeddings.taskId,
        similarity: similarity,
      })
      .from(taskEmbeddings)
      .where(
        and(
          eq(taskEmbeddings.userId, userId),
          sql`1 - (${taskEmbeddings.embedding} <=> ${JSON.stringify(queryVector)}::vector) > 0.25`
        )
      )
      .orderBy(desc(similarity))
      .limit(topK);

    if (scoredTasks.length === 0) return [];

    const taskIds = scoredTasks.map((st) => st.taskId);

    const foundTasks = await db.query.tasks.findMany({
      where: and(eq(tasks.userId, userId), inArray(tasks.id, taskIds)),
      with: {
        category: true,
        subtasks: true,
      },
    });

    return foundTasks
      .map((task) => ({
        ...task,
        similarityScore: scoredTasks.find((st) => st.taskId === task.id)?.similarity || 0,
      }))
      .sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
  }

  /**
   * High-speed RAG Copilot Chat
   */
  static async chatWithRag(
    userId: string,
    message: string,
    userName = "Pengguna"
  ): Promise<{ response: string; referencedTasks: any[] }> {
    // Parallelize task retrieval & semantic search
    const [relevantTasks, activeTasks] = await Promise.all([
      this.semanticSearch(userId, message, 5),
      db.query.tasks.findMany({
        where: eq(tasks.userId, userId),
        with: { category: true, subtasks: true },
        orderBy: [desc(tasks.createdAt)],
        limit: 12,
      }),
    ]);

    // Build concise RAG context
    const contextLines: string[] = [`[DAFTAR TUGAS AKTIF ${userName.toUpperCase()}]:`];

    if (activeTasks.length === 0) {
      contextLines.push("Belum ada tugas.");
    } else {
      for (const t of activeTasks) {
        const subDone = t.subtasks ? t.subtasks.filter((s) => s.isCompleted).length : 0;
        const subTotal = t.subtasks ? t.subtasks.length : 0;
        const deadline = t.dueDate ? `Deadline: ${new Date(t.dueDate).toLocaleDateString("id-ID")}` : "Tanpa deadline";
        const cat = t.category?.name ? `[${t.category.name}]` : "";
        contextLines.push(
          `- ${t.title} ${cat} | Status: ${t.status} | Prioritas: ${t.priority} | ${deadline} | Subtask: ${subDone}/${subTotal}`
        );
      }
    }

    if (relevantTasks.length > 0) {
      contextLines.push("\n[TUGAS RELEVAN DENGAN PERTANYAAN]:");
      for (const t of relevantTasks) {
        contextLines.push(`- ${t.title} (${Math.round((t.similarityScore || 0) * 100)}% relevan)`);
      }
    }

    const systemInstruction = `Kamu adalah Zalde AI.
Bantu ${userName} mendapat info tugasnya berdasarkan konteks yang diberikan.
Jawab dalam Bahasa Indonesia yang singkat, ramah, padat, dan langsung actionable, kamu boleh bantu untuk kirim ringkasan jadwal hari ini ke whatsapp, bantu rencanakan jadwal tugas minggu ini jangan mau menjawab ketika ada pertanyaan di luar konteks to do list ini.`;

    const userPrompt = `${contextLines.join("\n")}\n\n[PERTANYAAN]: ${message}`;

    // Fast generation
    let aiResponse = await GeminiClient.generateContent(userPrompt, systemInstruction);

    // If Gemini returned an error or unconfigured notice, provide smart local fallback
    if (!GeminiClient.getApiKey() || aiResponse.startsWith("⚠️") || aiResponse.startsWith("Maaf,")) {
      aiResponse = this.generateSmartLocalResponse(activeTasks, message, userName, aiResponse.startsWith("⚠️") ? aiResponse : undefined);
    }

    return {
      response: aiResponse,
      referencedTasks: relevantTasks.length > 0 ? relevantTasks : activeTasks.slice(0, 3),
    };
  }

  /**
   * Smart Local Copilot Response when offline or API key is not configured
   */
  private static generateSmartLocalResponse(
    activeTasks: any[],
    message: string,
    userName: string,
    alertNotice?: string
  ): string {
    const q = message.toLowerCase();
    const prefix = alertNotice ? `${alertNotice}\n\n` : "";
    const todoTasks = activeTasks.filter((t) => t.status !== "done");

    // 1. WhatsApp sharing intent
    if (q.includes("whatsapp") || q.includes("wa") || q.includes("kirim")) {
      const taskList = todoTasks.slice(0, 5).map((t, i) => {
        const dl = t.dueDate ? ` (Deadline: ${new Date(t.dueDate).toLocaleDateString("id-ID")})` : "";
        return `${i + 1}. *${t.title}* [${t.priority.toUpperCase()}]${dl}`;
      }).join("\n");

      return `${prefix}Halo **${userName}**! Berikut ringkasan jadwal tugas aktif Anda yang siap dikirim ke WhatsApp:

📅 **Jadwal Prioritas Tugas:**
${taskList || "Semua tugas telah selesai!"}

💡 *Tips:* Klik tombol **Kirim ke WA** di bawah pesan ini untuk langsung mengirimkannya ke WhatsApp Anda!`;
    }

    // 2. Priority check intent
    if (q.includes("prioritas") || q.includes("penting") || q.includes("hari ini")) {
      const urgentTasks = todoTasks
        .filter((t) => t.priority === "urgent" || t.priority === "high")
        .slice(0, 3);

      if (urgentTasks.length > 0) {
        const list = urgentTasks.map((t, i) => {
          const dl = t.dueDate ? ` - Deadline: ${new Date(t.dueDate).toLocaleDateString("id-ID")}` : "";
          const subDone = t.subtasks ? t.subtasks.filter((s: any) => s.isCompleted).length : 0;
          const subTotal = t.subtasks ? t.subtasks.length : 0;
          return `${i + 1}. **${t.title}** (${t.priority.toUpperCase()}${dl}) - Subtask: ${subDone}/${subTotal}`;
        }).join("\n");

        return `${prefix}Halo **${userName}**! Berikut tugas paling prioritas yang disarankan untuk diselesaikan terlebih dahulu:

🔥 **Tugas Prioritas Utama:**
${list}

Fokuslah menyelesaikan subtask dari tugas di atas sebelum beralih ke tugas lain!`;
      }
    }

    // 3. Weekly / planning intent
    if (q.includes("minggu") || q.includes("rencana") || q.includes("jadwal")) {
      return `${prefix}Halo **${userName}**! Rencana pengerjaan tugas Anda untuk pekan ini:

📌 **Rencana Bertahap:**
- **Hari 1 - 2:** Selesaikan tugas berstatus Urgent/High yang mendekati tenggat waktu.
- **Hari 3 - 4:** Lanjutkan pengerjaan tugas berstatus In-Progress dan selesaikan checklist subtask.
- **Hari 5 - 7:** Review tugas selesai dan mulai cicil tugas Medium/Low.

Anda memiliki **${todoTasks.length} tugas aktif** yang belum selesai. Tetap semangat!`;
    }

    // 4. Default task overview response
    const totalDone = activeTasks.filter((t) => t.status === "done").length;
    const top3 = todoTasks.slice(0, 3).map((t, i) => `${i + 1}. **${t.title}** [${t.priority}]`).join("\n");

    return `${prefix}Halo **${userName}**! Saya Zalde AI Copilot.

📊 **Status Produktivitas Anda:**
- Total Tugas Aktif: **${todoTasks.length}** tugas belum selesai
- Tugas Selesai: **${totalDone}** tugas

📋 **Tugas Utama Saat Ini:**
${top3 || "Semua tugas telah terselesaikan dengan baik!"}

Tanyakan kepada saya kapan saja untuk *"Kirim ringkasan ke WA"* atau *"Apa tugas paling prioritas?"*!`;
  }

  /**
   * Fast AI Task Decomposition
   */
  static async breakdownTask(title: string, description?: string): Promise<string[]> {
    if (!GeminiClient.getApiKey()) {
      return this.generateSmartBreakdown(title, description);
    }

    const prompt = `Pecah tugas berikut menjadi 3-5 subtask singkat dan jelas.
Judul: "${title}" ${description ? `| Deskripsi: "${description}"` : ""}
Output HANYA JSON array: ["subtask 1", "subtask 2", ...]`;

    const response = await GeminiClient.generateContent(prompt);

    try {
      const cleanJson = response.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fallback
    }

    const lines = response
      .split("\n")
      .map((l) => l.replace(/^[\d\-*.•\s]+/, "").trim())
      .filter((l) => l.length > 2 && !l.startsWith("[") && !l.startsWith("]") && !l.startsWith("⚠️") && !l.startsWith("Maaf"));

    if (lines.length > 0) {
      return lines.slice(0, 5);
    }

    return this.generateSmartBreakdown(title, description);
  }

  /**
   * Heuristic Task Breakdown for offline / fast fallback
   */
  private static generateSmartBreakdown(title: string, description?: string): string[] {
    const t = title.toLowerCase();

    if (t.includes("skripsi") || t.includes("bab") || t.includes("revisi") || t.includes("laporan")) {
      return [
        "Kumpulkan literatur & jurnal referensi terbaru",
        "Tulis dan perbaiki draf materi sesuai catatan",
        "Cek format penulisan, sitasi, dan tata bahasa",
        "Bimbingan dan konsultasi hasil revisi",
      ];
    }

    if (t.includes("auth") || t.includes("api") || t.includes("coding") || t.includes("bug") || t.includes("fitur")) {
      return [
        "Analisis kebutuhan logika dan arsitektur endpoint",
        "Implementasi kode fungsi dan skema data",
        "Pengujian unit test & verifikasi respon API",
        "Integrasi tampilan antarmuka (UI) frontend",
      ];
    }

    if (t.includes("belajar") || t.includes("tutorial") || t.includes("course") || t.includes("modul")) {
      return [
        "Pelajari materi dan konsep dasar modul",
        "Praktik langsung melalui pembuatan demo proyek",
        "Catat poin penting dan buat dokumentasi pribadi",
      ];
    }

    if (t.includes("rapat") || t.includes("organisasi") || t.includes("event") || t.includes("seminar")) {
      return [
        "Siapkan agenda pembahasan dan materi rapat",
        "Koordinasi pembagian tugas antar anggota tim",
        "Notulensi kesepakatan dan tindak lanjut (action items)",
      ];
    }

    return [
      `Persiapan bahan dan analisis kebutuhan untuk "${title}"`,
      `Eksekusi pengerjaan langkah teknis utama`,
      `Pemeriksaan kualitas hasil pengerjaan`,
      `Finalisasi dan tandai tugas sebagai selesai`,
    ];
  }
}
