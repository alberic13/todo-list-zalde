export const env = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  JWT_SECRET: process.env.JWT_SECRET || "zalde_super_secret_jwt_token_development_key_32bytes",
  DATABASE_URL: process.env.DATABASE_URL || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  NODE_ENV: process.env.NODE_ENV || "development",
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "",
};
