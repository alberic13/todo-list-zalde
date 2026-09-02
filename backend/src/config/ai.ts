import { env } from "./env";

export class GeminiClient {
  private static apiKey = env.GEMINI_API_KEY;

  /**
   * Generate vector embedding using gemini-embedding-001 or fallback
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      console.warn("⚠️ GEMINI_API_KEY not set. Using deterministic fallback embedding for development.");
      return this.generateFallbackEmbedding(text);
    }

    const candidateModels = ["gemini-embedding-001", "gemini-embedding-2", "text-embedding-004"];

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${this.apiKey}`;
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
        // Try next candidate
      }
    }

    return this.generateFallbackEmbedding(text);
  }

  /**
   * Generate text response using Gemini 2.5 Flash / Gemini Flash Latest
   */
  static async generateContent(prompt: string, systemInstruction?: string): Promise<string> {
    if (!this.apiKey) {
      return "⚠️ [Demo Mode]: API Key Google Gemini belum diatur di file `.env`. Silakan masukkan `GEMINI_API_KEY` Anda di `.env`.";
    }

    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-flash-lite",
      "gemini-pro-latest",
      "gemini-3.6-flash",
    ];

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

        if (response.ok) {
          const data = (await response.json()) as any;
          const candidate = data.candidates?.[0];
          const text = candidate?.content?.parts?.[0]?.text;
          if (text) return text;
        }
      } catch (err) {
        // Try next candidate
      }
    }

    return "Maaf, tidak dapat menghasilkan respon dari Gemini AI saat ini.";
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
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map((val) => val / norm);
  }
}
