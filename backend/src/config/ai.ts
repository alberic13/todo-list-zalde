import { env } from "./env";

export class GeminiClient {
  private static getApiKey(): string {
    return env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  }

  /**
   * Fast vector embedding generator using gemini-embedding-001 with 768 output dimensions
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return this.generateFallbackEmbedding(text);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000), // 8s timeout
        body: JSON.stringify({
          content: {
            parts: [{ text }],
          },
          outputDimensionality: 768,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data.embedding?.values && data.embedding.values.length > 0) {
          const rawValues: number[] = data.embedding.values;
          const norm = Math.sqrt(rawValues.reduce((sum, val) => sum + val * val, 0)) || 1;
          return rawValues.map((val) => val / norm);
        }
      }
    } catch (err) {
      // Graceful fallback to mock vector
    }

    return this.generateFallbackEmbedding(text);
  }

  /**
   * Ultra-fast text response using lightweight, low-latency Gemini Flash Lite models (<1s)
   */
  static async generateContent(prompt: string, systemInstruction?: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return "⚠️ [Demo Mode]: Masukkan GEMINI_API_KEY di backend/.env untuk mengaktifkan AI.";
    }

    // Prioritized by lowest latency and high availability
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
    ];

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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
            maxOutputTokens: 1000,
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
          signal: AbortSignal.timeout(10000), // 10s timeout
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          const candidate = data.candidates?.[0];
          const text = candidate?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        }
      } catch (err) {
        // Fallback immediately to next available candidate model
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
