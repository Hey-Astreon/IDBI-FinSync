import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z
  .object({
    DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid connection URL.' }),
    JWT_SECRET: z.string().min(32, { message: 'JWT_SECRET must be at least 32 characters long.' }),
    PORT: z
      .string()
      .regex(/^\d+$/, { message: 'PORT must be a numeric string.' })
      .transform(Number)
      .default('5000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CORS_WHITELIST: z.string().optional().default('http://localhost:3000,http://localhost:5173'),
    GEMINI_API_KEY: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production') {
        return (
          !!data.GEMINI_API_KEY &&
          data.GEMINI_API_KEY !== 'your_gemini_api_key_here' &&
          data.GEMINI_API_KEY !== 'AIzaSyPlaceholderKeyForLocalDevelopmentAndDemos'
        );
      }
      return true;
    },
    {
      message: 'GEMINI_API_KEY is required in production mode.',
      path: ['GEMINI_API_KEY'],
    },
  );

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errorDetails = JSON.stringify(result.error.format(), null, 2);
  throw new Error(`❌ Environment validation failed on startup:\n${errorDetails}`);
}

export const env = result.data;
