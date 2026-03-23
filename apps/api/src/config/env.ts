import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  WEB_URL: z.string().default("http://localhost:3000"),
  API_URL: z.string().default("http://localhost:4000"),
  PORT: z.coerce.number().default(4000),
  JWT_ACCESS_SECRET: z.string().default("change-me-access"),
  JWT_REFRESH_SECRET: z.string().default("change-me-refresh")
});

export const env = envSchema.parse(process.env);

