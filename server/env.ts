import dotenv from 'dotenv';
import { z } from 'zod';
import {
  defaultPublicAppConfig,
  normalizeAppLocale,
  type PublicAppConfig
} from '../shared/app-config.js';

loadEnvironmentFiles();

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  PORT: z.coerce.number().int().positive().default(8787),
  PUBLIC_API_BASE_URL: z.string().trim().min(1).default(defaultPublicAppConfig.apiBaseUrl),
  PUBLIC_APP_NAME: z.string().trim().min(1).default(defaultPublicAppConfig.appName),
  PUBLIC_DEFAULT_LOCALE: z
    .string()
    .trim()
    .transform((value) => normalizeAppLocale(value))
    .default(defaultPublicAppConfig.defaultLocale)
});

export const env = envSchema.parse(process.env);

export const publicAppConfig: PublicAppConfig = {
  apiBaseUrl: env.PUBLIC_API_BASE_URL,
  appName: env.PUBLIC_APP_NAME,
  defaultLocale: env.PUBLIC_DEFAULT_LOCALE
};

function loadEnvironmentFiles() {
  const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const candidateFiles = [
    `.env.${mode}.local`,
    '.env.local',
    `.env.${mode}`,
    '.env'
  ];

  for (const path of candidateFiles) {
    dotenv.config({ path, override: false });
  }
}
