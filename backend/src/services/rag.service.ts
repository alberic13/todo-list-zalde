import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { db } from "../config/db";
import { tasks, taskEmbeddings, subtasks, categories } from "../models/schema";
import { GeminiClient } from "../config/ai";

export class RagService {
  /**
   * Helper to calculate cosine similarity between two vectors
   */
  private static cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Semantic search using vector cosine similarity
   */
  static async semanticSearch(userId: string, query: string, topK = 10) {
    if (!query.trim()) return [];

    // 1. Generate query embedding
    const queryVector = await GeminiClient.generateEmbedding(query);

    // 2. Fetch all user embeddings from database
    const userEmbeddings = await db
      .select({
        taskId: taskEmbeddings.taskId,
        embedding: taskEmbeddings.embedding,
        contentChunk: taskEmbeddings.contentChunk,
      })
      .from(taskEmbeddings)
      .where(eq(taskEmbeddings.userId, userId));

    if (userEmbeddings.length === 0) return [];

    // 3. Score each task by cosine similarity
    const scoredTasks = userEmbeddings
      .map((item) => {
        const similarity = this.cosineSimilarity(queryVector, item.embedding);
        return {
          taskId: item.taskId,
          similarity: Math.round(similarity * 100) / 100,
        };
      })
      .filter((item) => item.similarity > 0.3) // Relevancy threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    if (scoredTasks.length === 0) return [];

    const taskIds = scoredTasks.map((st) => st.taskId);

    // 4. Fetch full task objects with relations
    const foundTasks = await db.query.tasks.findMany({
      where: and(eq(tasks.userId, userId), inArray(tasks.id, taskIds)),
      with: {
        category: true,
        subtasks: true,
      },
    });

    // Map similarity score back to tasks
    return foundTasks
      .map((task) => {
        const score = scoredTasks.find((st) => st.taskId === task.id)?.similarity || 0;
        return {
          ...task,
          similarityScore: score,
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore);
  }

  /**
   * RAG Copilot Chat: retrieves user context & answers questions
   */
  static async chatWithRag(
    userId: string,
    message: string,
    userName = "Pengguna"
  ): Promise<{ response: string; referencedTasks: any[] }> {
    // 1. Retrieve top-5 semantically relevant tasks
    const relevantTasks = await this.semanticSearch(userId, message, 5);

    // 2. Retrieve high-priority & upcoming/in-progress tasks
    const activeTasks = await db.query.tasks.findMany({
      where: and(eq(tasks.userId, userId)),
      with: { category: true, subtasks: true },
      orderBy: [desc(tasks.createdAt)],
      limit: 10,
    });

    // 3. Build RAG Context string
    const contextBuilder: string[] = [];
    contextBuilder.push(`[DAFTAR TUGAS AKTIF PENGGUNA (${userName})]:`);

    if (activeTasks.length === 0) {
      contextBuilder.push("Pengguna belum memiliki daftar tugas.");
    } else {
      for (const t of activeTasks) {
        const subCount = t.subtasks ? `${t.subtasks.filter((s) => s.isCompleted).length}/${t.subtasks.length} subtask selesai` : "0 subtask";
        const deadline = t.dueDate ? `Deadline: ${new Date(t.dueDate).toLocaleDateString("id-ID")}` : "Tanpa deadline";
        const cat = t.category?.name ? `[${t.category.name}]` : "";
        contextBuilder.push(
          `- ${t.title} ${cat} | Status: ${t.status} | Prioritas: ${t.priority} | ${deadline} | ${subCount} | Ket: ${t.description || "-"}`
        );
      }
    }

    if (relevantTasks.length > 0) {
      contextBuilder.push("\n[TUGAS PALING RELEVAN DENGAN PERTANYAAN]:");
      for (const t of relevantTasks) {
        contextBuilder.push(`- ${t.title} (Skor Relevansi: ${t.similarityScore * 100}%)`);
      }
    }

    const contextText = contextBuilder.join("\n");

    const systemInstruction = `Kamu adalah Zalde AI Productivity Copilot, asisten pintar untuk aplikasi ZaldeTodo.
Tugasmu adalah membantu ${userName} merencanakan, memprioritaskan, mengorganisir, dan menjawab pertanyaan seputar tugas harian mereka.

Pedoman:
1. Gunakan Bahasa Indonesia yang ramah, sopan, profesional, terstruktur, dan actionable.
2. Selalu rujuk data tugas pengguna yang ada di konteks jika relevan.
3. Berikan saran prioritas yang logis (misal: selesaikan yang urgent / deadline terdekat dulu).
4. Gunakan bullet point atau nomor jika memberikan langkah atau daftar rekomendasi.`;

    const userPrompt = `${contextText}\n\n[PERTANYAAN PENGGUNA]:\n${message}`;

    // 4. Generate AI response
    const aiResponse = await GeminiClient.generateContent(userPrompt, systemInstruction);

    return {
      response: aiResponse,
      referencedTasks: relevantTasks,
    };
  }

  /**
   * AI Task Decomposition: generates subtasks array from task title & description
   */
  static async breakdownTask(title: string, description?: string): Promise<string[]> {
    const prompt = `Pecah tugas berikut menjadi 3 sampai 6 subtask (langkah kerja spesifik, terukur, dan berurutan).
Judul Tugas: "${title}"
${description ? `Deskripsi: "${description}"` : ""}

Format Output WAJIB berupa JSON Array murni tanpa format markdown tambahan, contoh:
["Langkah 1...", "Langkah 2...", "Langkah 3..."]`;

    const response = await GeminiClient.generateContent(prompt);

    try {
      // Clean possible markdown codeblock wrappers
      const cleanJson = response
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch (err) {
      console.warn("Failed to parse AI JSON response, falling back to line parsing:", err);
    }

    // Fallback: line-by-line parsing if JSON parse failed
    return response
      .split("\n")
      .map((line) => line.replace(/^[\d\-*.•\s]+/, "").trim())
      .filter((line) => line.length > 2 && !line.startsWith("[") && !line.startsWith("]"))
      .slice(0, 6);
  }
}
