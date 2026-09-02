import { describe, expect, it } from "bun:test";
import { EmbeddingService } from "../src/services/embedding.service";
import { GeminiClient } from "../src/config/ai";

describe("RAG & Embedding Unit Tests", () => {
  it("should construct standardized chunk text accurately", () => {
    const chunk = EmbeddingService.buildChunk({
      title: "Desain Mockup Figma",
      description: "Desain sistem UI/UX untuk fitur Todo AI",
      categoryName: "Design",
      priority: "high",
      status: "in_progress",
    });

    expect(chunk).toContain("Title: Desain Mockup Figma");
    expect(chunk).toContain("Description: Desain sistem UI/UX untuk fitur Todo AI");
    expect(chunk).toContain("Category: Design");
    expect(chunk).toContain("Priority: high");
    expect(chunk).toContain("Status: in_progress");
  });

  it("should generate 768-dimension normalized vector fallback", async () => {
    const embedding = await GeminiClient.generateEmbedding("Test query task");
    expect(embedding).toBeArray();
    expect(embedding.length).toBe(768);

    // Verify normalization: length of unit vector ~ 1
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    expect(norm).toBeGreaterThan(0.99);
    expect(norm).toBeLessThan(1.01);
  });
});
