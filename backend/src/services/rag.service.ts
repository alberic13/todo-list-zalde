import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "../config/db";
import { tasks, taskEmbeddings } from "../models/schema";
import { GeminiClient } from "../config/ai";

export class RagService {
  /**
   * Fast Cosine Similarity calculation
   */
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    const len = Math.min(vecA.length, vecB.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Fast vector semantic search
   */
  static async semanticSearch(userId: string, query: string, topK = 10) {
    if (!query.trim()) return [];

    // Parallel: generate query embedding & fetch stored user embeddings concurrently
    const [queryVector, userEmbeddings] = await Promise.all([
      GeminiClient.generateEmbedding(query),
      db
        .select({
          taskId: taskEmbeddings.taskId,
          embedding: taskEmbeddings.embedding,
        })
        .from(taskEmbeddings)
        .where(eq(taskEmbeddings.userId, userId)),
    ]);

    if (userEmbeddings.length === 0) return [];

    // Score in-memory
    const scoredTasks = userEmbeddings
      .map((item) => ({
        taskId: item.taskId,
        similarity: Math.round(this.cosineSimilarity(queryVector, item.embedding) * 100) / 100,
      }))
      .filter((item) => item.similarity > 0.25)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

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
Bantu ${userName} mendapat info  tugasnya berdasarkan konteks yang diberikan.
Jawab dalam Bahasa Indonesia yang singkat, ramah, padat, dan langsung actionable,kamu boleh bantu untuk kirim ringkasan jadwal hari ini ke whatsapp, bantu rencanakan jadwal tugas minggu ini jangan mau menjawab ketika ada pertanyaan di luar konteks to do list ini.`;

    const userPrompt = `${contextLines.join("\n")}\n\n[PERTANYAAN]: ${message}`;

    // Fast generation
    const aiResponse = await GeminiClient.generateContent(userPrompt, systemInstruction);

    return {
      response: aiResponse,
      referencedTasks: relevantTasks,
    };
  }

  /**
   * Fast AI Task Decomposition
   */
  static async breakdownTask(title: string, description?: string): Promise<string[]> {
    const prompt = `Pecah tugas berikut menjadi 3-5 subtask singkat dan jelas.
Judul: "${title}" ${description ? `| Deskripsi: "${description}"` : ""}
Output HANYA JSON array: ["subtask 1", "subtask 2", ...]`;

    const response = await GeminiClient.generateContent(prompt);

    try {
      const cleanJson = response.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Line fallback
    }

    return response
      .split("\n")
      .map((l) => l.replace(/^[\d\-*.•\s]+/, "").trim())
      .filter((l) => l.length > 2 && !l.startsWith("[") && !l.startsWith("]"))
      .slice(0, 5);
  }
}
