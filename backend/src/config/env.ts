export const env = {
  PORT: parseInt(process.env.PORT || "3001", 10),
  JWT_SECRET: process.env.JWT_SECRET || "zalde_super_secret_jwt_token_development_key_32bytes",
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/todo_db",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  NODE_ENV: process.env.NODE_ENV || "development",
};
