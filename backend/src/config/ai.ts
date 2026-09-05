import { env } from "./env";

export class GeminiClient {
  private static readonly CANDIDATE_MODELS = [
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  private static readonly EMBEDDING_MODELS = [
    "gemini-embedding-001",
    "gemini-embedding-2",
    "text-embedding-004",
  ];

  public static getApiKey(): string {
    const key = (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
    if (!key || key === "your_gemini_api_key_here" || key.startsWith("your_")) {
      return "";
    }
    return key;
  }

  /**
   * Fast vector embedding generator using text-embedding-004 (768 output dimensions)
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return this.generateFallbackEmbedding(text);
    }

    for (const model of this.EMBEDDING_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;
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
        // Try fallback embedding model
      }
    }

    return this.generateFallbackEmbedding(text);
  }

  /**
   * Ultra-fast text response using official Gemini Flash models from Google GenAI
   */
  static async generateContent(prompt: string, systemInstruction?: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return "⚠️ [API Key Belum Diatur]: Kunci API Gemini belum diatur di file `backend/.env`. Silakan masukkan `GEMINI_API_KEY` Anda untuk mengaktifkan AI Copilot secara online.";
    }

    let lastErrorMessage = "";

    for (const model of this.CANDIDATE_MODELS) {
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
        } else {
          const errData = (await response.json().catch(() => null)) as any;
          const msg = errData?.error?.message || response.statusText;
          const reason = errData?.error?.details?.[0]?.reason || "";

          if (reason === "API_KEY_INVALID" || msg?.includes("API key not valid")) {
            return "⚠️ API Key Google Gemini tidak valid. Mohon periksa kembali GEMINI_API_KEY di file `backend/.env`.";
          }
          if (response.status === 429 || reason === "RATE_LIMIT_EXCEEDED" || msg?.includes("quota")) {
            return "⚠️ Limit kuota Gemini API tercapai (Rate Limit / Quota Exceeded). Coba kembali beberapa saat lagi.";
          }

          lastErrorMessage = msg || `HTTP ${response.status}`;
        }
      } catch (err: any) {
        lastErrorMessage = err?.message || "Koneksi timeout";
      }
    }

    return lastErrorMessage
      ? `Maaf, terjadi kendala saat menghubungi Google Gemini API (${lastErrorMessage}).`
      : "Maaf, respon AI sedang mengalami kendala jaringan. Silakan coba kembali.";
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
