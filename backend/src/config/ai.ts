import { env } from "./env";

export class GeminiClient {
  private static apiKey = env.GEMINI_API_KEY;

  /**
   * Fast vector embedding generator using direct gemini-embedding-001
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      return this.generateFallbackEmbedding(text);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: {
            parts: [{ text }],
          },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data.embedding?.values && data.embedding.values.length > 0) {
          return data.embedding.values;
        }
      }
    } catch (err) {
      console.warn("Fast embedding fallback triggered:", err);
    }

    return this.generateFallbackEmbedding(text);
  }

  /**
   * Ultra-fast text response using gemini-3.5-flash with 0 thinking latency
   */
  static async generateContent(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.apiKey) {
      return "⚠️ [Demo Mode]: Masukkan GEMINI_API_KEY di backend/.env untuk mengaktifkan AI.";
    }

    const candidateModels = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-2.5-flash"];

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const body: any = {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.6,
            topP: 0.9,
            maxOutputTokens: 800,
            thinkingConfig: {
              thinkingBudget: 0, // Disable thinking delay for instant responses
            },
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

        if (response.ok) {
          const data = (await response.json()) as any;
          const candidate = data.candidates?.[0];
          const text = candidate?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        }
      } catch (err) {
        // Try next candidate
      }
    }

    return "Maaf, respon AI sedang mengalami kendala jaringan. Silakan coba kembali.";
  }

  /**
   * Deterministic mock embedding generator
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
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map((val) => val / norm);
  }
}
