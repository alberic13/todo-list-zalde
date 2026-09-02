import { env } from "./env";

export class GeminiClient {
  private static apiKey = env.GEMINI_API_KEY;

  /**
   * Generate 768-dimension embedding using text-embedding-004
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      console.warn("⚠️ GEMINI_API_KEY not set. Using deterministic fallback embedding for development.");
      return this.generateFallbackEmbedding(text);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: {
            parts: [{ text }],
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini Embedding API Error:", errorText);
        return this.generateFallbackEmbedding(text);
      }

      const data = (await response.json()) as any;
      return data.embedding?.values || this.generateFallbackEmbedding(text);
    } catch (err) {
      console.error("Failed to generate embedding via Gemini API:", err);
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Generate text response using Gemini 1.5/2.0 Flash
   */
  static async generateContent(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.apiKey) {
      return "⚠️ [Demo Mode]: API Key Google Gemini belum diatur di file `.env`. Untuk mengaktifkan AI RAG dan jawaban dinamis secara penuh, silakan masukkan `GEMINI_API_KEY` Anda di `.env`.";
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const body: any = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      };

      if (systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini Generate API Error:", errorText);
        return `Gagal menghubungi Gemini AI: ${response.statusText}`;
      }

      const data = (await response.json()) as any;
      const candidate = data.candidates?.[0];
      return candidate?.content?.parts?.[0]?.text || "Tidak ada respon dari AI.";
    } catch (err: any) {
      console.error("Failed to generate content via Gemini API:", err);
      return `Terjadi kesalahan saat memproses permintaan AI: ${err.message}`;
    }
  }

  /**
   * Deterministic 768-dimension mock embedding generator for offline testing
   */
  private static generateFallbackEmbedding(text: string): number[] {
    const vector = new Array(768).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
      const index = Math.abs(hash) % 768;
      vector[index] = Math.sin(hash + i) * 0.5 + 0.5;
    }
    // Normalize vector
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map((val) => val / norm);
  }
}
