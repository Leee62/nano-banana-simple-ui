import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { z } from 'zod';
import { env, publicAppConfig } from './env.js';
import { generateGeminiImage } from './gemini.js';
import { getRequestLocale, getServerMessages } from './messages.js';
import {
  aspectRatioValues,
  getImageSizeOptions,
  getModelDefinition,
  imageModelValues,
  imageSizeValues,
  responseModeValues
} from '../shared/generation.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, '../client');

const requestSchema = z.object({
  model: z.enum(imageModelValues),
  prompt: z.string().trim().min(1).max(1600),
  responseMode: z.enum(responseModeValues),
  aspectRatio: z.enum(aspectRatioValues).optional(),
  imageSize: z.enum(imageSizeValues).optional(),
  grounding: z.object({
    webSearch: z.boolean(),
    imageSearch: z.boolean()
  }),
  referenceImages: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(180),
        mimeType: z.string().trim().min(1).max(80),
        data: z.string().trim().min(1)
      })
    )
    .max(14)
});

app.use(express.json({ limit: '25mb' }));

app.get('/app-config.js', (_request, response) => {
  response.type('application/javascript');
  response.setHeader('Cache-Control', 'no-store');
  response.send(`window.__APP_CONFIG__ = ${JSON.stringify(publicAppConfig)};\nexport {};`);
});

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.post('/api/generate-image', async (request, response) => {
  const locale = getRequestLocale(request.header('X-Locale'));
  const copy = getServerMessages(locale);
  const parsed = requestSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      error: parsed.error.issues[0]?.message ?? copy.invalidRequest
    });
    return;
  }

  const modelDefinition = getModelDefinition(parsed.data.model);
  const imageSizeValuesForModel = new Set(
    getImageSizeOptions(parsed.data.model, locale).map((option) => option.value)
  );

  if (!modelDefinition.aspectRatios.includes(parsed.data.aspectRatio ?? modelDefinition.defaultAspectRatio)) {
    response.status(400).json({
      error: copy.unsupportedAspectRatio
    });
    return;
  }

  if (parsed.data.imageSize && !imageSizeValuesForModel.has(parsed.data.imageSize)) {
    response.status(400).json({
      error: copy.unsupportedImageSize
    });
    return;
  }

  if (!modelDefinition.supportsWebGrounding && parsed.data.grounding.webSearch) {
    response.status(400).json({
      error: copy.unsupportedWebGrounding
    });
    return;
  }

  if (!modelDefinition.supportsImageSearchGrounding && parsed.data.grounding.imageSearch) {
    response.status(400).json({
      error: copy.unsupportedImageSearchGrounding
    });
    return;
  }

  try {
    const result = await generateGeminiImage(parsed.data, locale);
    response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : copy.generationFailed;
    response.status(500).json({ error: message });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDistPath));
  app.get('/{*path}', (_request, response) => {
    response.sendFile(path.resolve(clientDistPath, 'index.html'));
  });
}

app.listen(env.PORT, () => {
  console.log(`Nano Banana API server running at http://localhost:${env.PORT}`);
});
