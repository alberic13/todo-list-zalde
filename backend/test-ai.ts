import { GeminiClient } from "./src/config/ai";

async function run() {
  console.log("Menguji GeminiClient.generateContent...");
  const start = Date.now();
  const result = await GeminiClient.generateContent("Halo, siapa kamu? Jawab singkat 1 kalimat.");
  const end = Date.now();
  console.log(`\nResponse (${end - start}ms):\n${result}`);
}

run().catch(console.error);
