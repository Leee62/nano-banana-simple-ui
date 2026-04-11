import type { AppLocale } from './app-config.js';

export const imageModelValues = [
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image-preview',
  'gemini-2.5-flash-image'
] as const;

export const responseModeValues = ['image-only', 'text-and-image'] as const;

export const aspectRatioValues = [
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
  '1:8',
  '8:1',
  '1:4',
  '4:1'
] as const;

export const imageSizeValues = ['512', '1K', '2K', '4K'] as const;

export type ImageModel = (typeof imageModelValues)[number];
export type ResponseMode = (typeof responseModeValues)[number];
export type AspectRatio = (typeof aspectRatioValues)[number];
export type ImageSize = (typeof imageSizeValues)[number];

export interface UploadedReferenceImage {
  name: string;
  mimeType: string;
  data: string;
}

export interface GroundingConfig {
  webSearch: boolean;
  imageSearch: boolean;
}

export interface GroundingSource {
  type: 'web' | 'image';
  title: string;
  uri: string;
  domain?: string;
  imageUri?: string;
}

export interface GenerateImagePayload {
  model: ImageModel;
  prompt: string;
  responseMode: ResponseMode;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  grounding: GroundingConfig;
  referenceImages: UploadedReferenceImage[];
}

export interface GenerateImageResponse {
  imageDataUrl: string;
  mimeType: string;
  prompt: string;
  textResponse: string | null;
  model: ImageModel;
  modelLabel: string;
  responseMode: ResponseMode;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  grounding: GroundingConfig;
  referenceImageCount: number;
  searchQueries: string[];
  sources: GroundingSource[];
  generatedAt: string;
}

export interface ImageGenerationErrorResponse {
  error: string;
}

interface ModelDefinition {
  label: string;
  shortLabel: string;
  aspectRatios: readonly AspectRatio[];
  imageSizes: readonly ImageSize[];
  defaultAspectRatio: AspectRatio;
  defaultImageSize?: ImageSize;
  supportsWebGrounding: boolean;
  supportsImageSearchGrounding: boolean;
}

const modelDefinitions: Record<ImageModel, ModelDefinition> = {
  'gemini-3.1-flash-image-preview': {
    label: 'Gemini 3.1 Flash Image Preview',
    shortLabel: '3.1 Flash Preview',
    aspectRatios: [
      '1:1',
      '3:4',
      '4:3',
      '9:16',
      '16:9',
      '4:5',
      '5:4',
      '2:3',
      '3:2',
      '1:8',
      '8:1',
      '1:4',
      '4:1',
      '21:9'
    ],
    imageSizes: ['512', '1K', '2K', '4K'],
    defaultAspectRatio: '1:1',
    defaultImageSize: '1K',
    supportsWebGrounding: true,
    supportsImageSearchGrounding: true
  },
  'gemini-3-pro-image-preview': {
    label: 'Gemini 3 Pro Image Preview',
    shortLabel: '3 Pro Preview',
    aspectRatios: ['1:1', '3:4', '4:3', '9:16', '16:9', '4:5', '5:4', '2:3', '3:2', '21:9'],
    imageSizes: ['1K', '2K', '4K'],
    defaultAspectRatio: '1:1',
    defaultImageSize: '1K',
    supportsWebGrounding: true,
    supportsImageSearchGrounding: false
  },
  'gemini-2.5-flash-image': {
    label: 'Gemini 2.5 Flash Image',
    shortLabel: '2.5 Flash',
    aspectRatios: ['1:1', '3:4', '4:3', '9:16', '16:9', '4:5', '5:4', '2:3', '3:2', '21:9'],
    imageSizes: [],
    defaultAspectRatio: '1:1',
    supportsWebGrounding: false,
    supportsImageSearchGrounding: false
  }
};

export const imageModelOptions = imageModelValues.map((value) => ({
  value,
  ...modelDefinitions[value]
}));

const aspectRatioLabels: Record<AppLocale, Record<AspectRatio, string>> = {
  zh: {
    '1:1': '1:1 方形',
    '2:3': '2:3 海报',
    '3:2': '3:2 横构图',
    '3:4': '3:4 竖版',
    '4:3': '4:3 经典',
    '4:5': '4:5 社媒竖图',
    '5:4': '5:4 产品卡面',
    '9:16': '9:16 竖屏',
    '16:9': '16:9 横版',
    '21:9': '21:9 超宽',
    '1:8': '1:8 长横幅',
    '8:1': '8:1 长横幅',
    '1:4': '1:4 细长竖幅',
    '4:1': '4:1 细长横幅'
  },
  en: {
    '1:1': '1:1 Square',
    '2:3': '2:3 Poster',
    '3:2': '3:2 Landscape',
    '3:4': '3:4 Portrait',
    '4:3': '4:3 Classic',
    '4:5': '4:5 Social Portrait',
    '5:4': '5:4 Product Card',
    '9:16': '9:16 Vertical',
    '16:9': '16:9 Wide',
    '21:9': '21:9 Ultrawide',
    '1:8': '1:8 Banner',
    '8:1': '8:1 Banner',
    '1:4': '1:4 Tall',
    '4:1': '4:1 Long'
  }
};

const imageSizeLabels: Record<AppLocale, Record<ImageSize, string>> = {
  zh: {
    '512': '512',
    '1K': '1K',
    '2K': '2K',
    '4K': '4K'
  },
  en: {
    '512': '512',
    '1K': '1K',
    '2K': '2K',
    '4K': '4K'
  }
};

export function getModelDefinition(model: ImageModel) {
  return modelDefinitions[model];
}

export function getAspectRatioOptions(model: ImageModel, locale: AppLocale) {
  return modelDefinitions[model].aspectRatios.map((value) => ({
    value,
    label: aspectRatioLabels[locale][value]
  }));
}

export function getImageSizeOptions(model: ImageModel, locale: AppLocale) {
  return modelDefinitions[model].imageSizes.map((value) => ({
    value,
    label: imageSizeLabels[locale][value]
  }));
}
