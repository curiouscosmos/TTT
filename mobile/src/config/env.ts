import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_URL: z
    .string()
    .url()
    .default('http://localhost:3000')
    .transform((url) => url.replace(/\/$/, '')),
});

const parsedEnv = envSchema.parse({
  // Expo exposes EXPO_PUBLIC_* values to the client bundle. Keep the API URL in
  // environment config so dev/staging/prod builds do not require source edits.
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});

export const env = {
  apiUrl: parsedEnv.EXPO_PUBLIC_API_URL,
} as const;
