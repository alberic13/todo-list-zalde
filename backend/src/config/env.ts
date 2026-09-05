export const env = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  JWT_SECRET: process.env.JWT_SECRET || "zalde_super_secret_jwt_token_development_key_32bytes",
  DATABASE_URL: process.env.DATABASE_URL || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  NODE_ENV:
    process.env.NODE_ENV ||
    (process.env.BUN_ENV === "test" || (Array.isArray(process.argv) && process.argv.some((a) => a.includes("test")))
      ? "test"
      : "development"),
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  GMAIL_USER: process.env.GMAIL_USER || "",
  GMAIL_APP_PASSWORD: (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, ""),
  EMAIL_FROM: process.env.EMAIL_FROM || "Zalde Todo AI <zaldealberic@gmail.com>",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
};
