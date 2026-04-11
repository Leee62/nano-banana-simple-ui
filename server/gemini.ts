import {
  createPartFromBase64,
  createUserContent,
  GoogleGenAI,
  type GroundingChunk,
  Modality
} from '@google/genai';
import type { AppLocale } from '../shared/app-config.js';
import type {
  GenerateImagePayload,
  GenerateImageResponse,
  GroundingSource
} from '../shared/generation.js';
import { getModelDefinition } from '../shared/generation.js';
import { env } from './env.js';
import { getServerMessages } from './messages.js';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export async function generateGeminiImage(
  payload: GenerateImagePayload,
  locale: AppLocale
): Promise<GenerateImageResponse> {
  const copy = getServerMessages(locale);
  const prompt = payload.prompt.trim().replace(/\s+/g, ' ');
  const imageConfig = buildImageConfig(payload);
  const tools = buildTools(payload);
  const contentParts = [
    prompt,
    ...payload.referenceImages.map((image) => createPartFromBase64(image.data, image.mimeType))
  ];

  const response = await ai.models.generateContent({
    model: payload.model,
    contents: createUserContent(contentParts),
    config: {
      responseModalities:
        payload.responseMode === 'text-and-image'
          ? [Modality.TEXT, Modality.IMAGE]
          : [Modality.IMAGE],
      ...(imageConfig ? { imageConfig } : {}),
      ...(tools ? { tools } : {})
    }
  });

  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    throw new Error(copy.missingImage);
  }

  const mimeType = imagePart.inlineData.mimeType ?? 'image/png';
  const groundingMetadata = candidate?.groundingMetadata;
  const searchQueries = [
    ...(groundingMetadata?.webSearchQueries ?? []),
    ...(groundingMetadata?.imageSearchQueries ?? [])
  ];

  return {
    imageDataUrl: `data:${mimeType};base64,${imagePart.inlineData.data}`,
    mimeType,
    prompt,
    textResponse: response.text?.trim() ? response.text.trim() : null,
    model: payload.model,
    modelLabel: getModelDefinition(payload.model).label,
    responseMode: payload.responseMode,
    aspectRatio: payload.aspectRatio,
    imageSize: payload.imageSize,
    grounding: payload.grounding,
    referenceImageCount: payload.referenceImages.length,
    searchQueries: Array.from(new Set(searchQueries)),
    sources: extractGroundingSources(groundingMetadata?.groundingChunks ?? []),
    generatedAt: new Date().toISOString()
  };
}

function buildImageConfig(payload: GenerateImagePayload) {
  const imageConfig = {
    ...(payload.aspectRatio ? { aspectRatio: payload.aspectRatio } : {}),
    ...(payload.imageSize ? { imageSize: payload.imageSize } : {})
  };

  return Object.keys(imageConfig).length > 0 ? imageConfig : null;
}

function buildTools(payload: GenerateImagePayload) {
  if (!payload.grounding.webSearch && !payload.grounding.imageSearch) {
    return null;
  }

  return [
    {
      googleSearch: {
        searchTypes: {
          ...(payload.grounding.webSearch ? { webSearch: {} } : {}),
          ...(payload.grounding.imageSearch ? { imageSearch: {} } : {})
        }
      }
    }
  ];
}

function extractGroundingSources(chunks: GroundingChunk[]): GroundingSource[] {
  const sources: GroundingSource[] = [];

  for (const chunk of chunks) {
    if (chunk.web?.uri) {
      sources.push({
        type: 'web',
        title: chunk.web.title ?? chunk.web.uri,
        uri: chunk.web.uri,
        domain: chunk.web.domain
      });
      continue;
    }

    if (chunk.image?.sourceUri) {
      sources.push({
        type: 'image',
        title: chunk.image.title ?? chunk.image.sourceUri,
        uri: chunk.image.sourceUri,
        imageUri: chunk.image.imageUri,
        domain: chunk.image.domain
      });
    }
  }

  return sources.filter(
    (source, index, list) => list.findIndex((item) => item.uri === source.uri) === index
  );
}
