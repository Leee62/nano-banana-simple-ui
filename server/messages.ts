import { normalizeAppLocale, type AppLocale } from '../shared/app-config.js';

const serverMessages = {
  zh: {
    invalidRequest: '请求参数不合法。',
    unsupportedAspectRatio: '当前模型不支持这个宽高比。',
    unsupportedImageSize: '当前模型不支持这个输出尺寸。',
    unsupportedWebGrounding: '当前模型不支持网页搜索 grounding。',
    unsupportedImageSearchGrounding: '当前模型不支持图片搜索 grounding。',
    generationFailed: '生成失败，请稍后重试。',
    missingImage: 'Gemini 没有返回图片数据，请调整 prompt 或参考图后重试。'
  },
  en: {
    invalidRequest: 'The request payload is invalid.',
    unsupportedAspectRatio: 'This model does not support the selected aspect ratio.',
    unsupportedImageSize: 'This model does not support the selected output size.',
    unsupportedWebGrounding: 'This model does not support web search grounding.',
    unsupportedImageSearchGrounding: 'This model does not support image search grounding.',
    generationFailed: 'Generation failed. Please try again later.',
    missingImage:
      'Gemini did not return image data. Please adjust the prompt or reference images and try again.'
  }
} as const;

export function getRequestLocale(value: string | string[] | undefined): AppLocale {
  return normalizeAppLocale(Array.isArray(value) ? value[0] : value);
}

export function getServerMessages(locale: AppLocale) {
  return serverMessages[locale];
}
