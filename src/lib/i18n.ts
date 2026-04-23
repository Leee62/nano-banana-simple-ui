import { appConfig } from '@/lib/runtime-config';
import { normalizeAppLocale, type AppLocale } from '../../shared/app-config';

export const APP_LOCALE_STORAGE_KEY = 'nano-banana-locale';

type MessageSet = {
  languageLabel: string;
  zhLabel: string;
  enLabel: string;
  title: string;
  subtitle: string;
  promptLabel: string;
  promptPlaceholder: string;
  promptCounter: (count: number) => string;
  modelLabel: string;
  aspectRatioLabel: string;
  imageSizeLabel: string;
  defaultSize: string;
  concurrentLabel: string;
  imageUnit: string;
  webSearchLabel: string;
  imageSearchLabel: string;
  generatingStatus: (finished: number, total: number) => string;
  standbyStatus: string;
  shortcutHint: string;
  referenceImagesCount: (count: number) => string;
  generateButton: string;
  generatingButton: string;
  promptRequiredError: string;
  generationFailedError: string;
  partialFailureError: (successCount: number, failedCount: number, reason?: string) => string;
  referenceReadError: string;
  referenceLimitError: (limit: number) => string;
  promptSectionTitle: string;
  controlsSectionTitle: string;
  referenceSectionTitle: string;
  uploadReference: string;
  generatedImageSectionTitle: string;
  generatedImageHint: string;
  imageHistorySectionTitle: string;
  addToReference: string;
  fullscreenPreview: string;
  closePreview: string;
  collapseHistory: string;
  expandHistory: string;
  cancelCompare: string;
  compareImage: string;
  deleteReference: (name: string) => string;
  deleteReferenceShort: string;
  deleteHistory: string;
  selectAll: string;
  clearSelection: string;
  downloadSelected: string;
  historyPersistenceHint: string;
  noHistory: string;
  noReference: string;
  emptyStateTitle: string;
  emptyStateHint: string;
  emptyStateGenerating: (count: number) => string;
  emptyStateAction: string;
};

export const localeOptions: Array<{ value: AppLocale; label: string }> = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' }
];

export const messages: Record<AppLocale, MessageSet> = {
  zh: {
    languageLabel: '语言',
    zhLabel: '中文',
    enLabel: 'English',
    title: appConfig.appName,
    subtitle: '一个支持参考图、多图并发和 Gemini Grounding 的创作工作台',
    promptLabel: '提示词',
    promptPlaceholder: '描述主体、风格、材质、光线、镜头和构图重点。',
    promptCounter: (count) => `${count} 字`,
    modelLabel: '模型',
    aspectRatioLabel: '比例',
    imageSizeLabel: '尺寸',
    defaultSize: '默认尺寸',
    concurrentLabel: '并发',
    imageUnit: '张',
    webSearchLabel: '网页搜索',
    imageSearchLabel: '图片搜索',
    generatingStatus: (finished, total) => `生成中 ${finished}/${total}`,
    standbyStatus: '待命',
    shortcutHint: '快捷键',
    referenceImagesCount: (count) => `${count} 张参考图`,
    generateButton: '生成图片',
    generatingButton: '正在生成',
    promptRequiredError: '先写下要生成的内容。',
    generationFailedError: '生成失败，请稍后重试。',
    partialFailureError: (successCount, failedCount, reason) =>
      `已生成 ${successCount} 张，另有 ${failedCount} 张失败。${reason ?? ''}`.trim(),
    referenceReadError: '参考图读取失败，请重新选择图片。',
    referenceLimitError: (limit) => `最多只能放 ${limit} 张参考图。`,
    promptSectionTitle: '生成设定',
    controlsSectionTitle: '参数面板',
    referenceSectionTitle: '参考图',
    uploadReference: '参考图上传',
    generatedImageSectionTitle: '生成结果',
    generatedImageHint: '主画布会优先显示最近一次生成的图片',
    imageHistorySectionTitle: '生成图片',
    addToReference: '加入参考图',
    fullscreenPreview: '全屏预览',
    closePreview: '关闭预览',
    collapseHistory: '收起右侧',
    expandHistory: '展开右侧',
    cancelCompare: '取消对比',
    compareImage: '加入对比',
    deleteReference: (name) => `删除 ${name}`,
    deleteReferenceShort: '删除参考图',
    deleteHistory: '删除历史图',
    selectAll: '全选',
    clearSelection: '取消全选',
    downloadSelected: '下载所选',
    historyPersistenceHint: '刷新或退出会清空，请先保存图片',
    noHistory: '生成后的图片会显示在这里，支持多选、下载和加入对比。',
    noReference: '上传参考图后可以直接参与下一次生成。',
    emptyStateTitle: '暂无图片',
    emptyStateHint: '写下 prompt 后就可以开始生成，也可以先上传参考图。',
    emptyStateGenerating: (count) => `正在生成 ${count} 张图片`,
    emptyStateAction: '开始生成'
  },
  en: {
    languageLabel: 'Language',
    zhLabel: '中文',
    enLabel: 'English',
    title: appConfig.appName,
    subtitle: 'A Gemini image workspace with reference images, concurrency, and grounding',
    promptLabel: 'Prompt',
    promptPlaceholder: 'Describe the subject, style, material, lighting, camera, and composition.',
    promptCounter: (count) => `${count} chars`,
    modelLabel: 'Model',
    aspectRatioLabel: 'Aspect Ratio',
    imageSizeLabel: 'Image Size',
    defaultSize: 'Default Size',
    concurrentLabel: 'Parallel',
    imageUnit: 'images',
    webSearchLabel: 'Web Search',
    imageSearchLabel: 'Image Search',
    generatingStatus: (finished, total) => `Generating ${finished}/${total}`,
    standbyStatus: 'Standby',
    shortcutHint: 'Shortcut',
    referenceImagesCount: (count) => `${count} reference images`,
    generateButton: 'Generate Image',
    generatingButton: 'Generating',
    promptRequiredError: 'Write a prompt before generating.',
    generationFailedError: 'Generation failed. Please try again later.',
    partialFailureError: (successCount, failedCount, reason) =>
      `${successCount} image(s) succeeded and ${failedCount} failed.${reason ? ` ${reason}` : ''}`,
    referenceReadError: 'Failed to read the selected reference image.',
    referenceLimitError: (limit) => `You can upload up to ${limit} reference images.`,
    promptSectionTitle: 'Prompt Setup',
    controlsSectionTitle: 'Controls',
    referenceSectionTitle: 'Reference Images',
    uploadReference: 'Upload Reference',
    generatedImageSectionTitle: 'Generated Result',
    generatedImageHint: 'The main canvas always focuses on your latest generated image',
    imageHistorySectionTitle: 'Generated Images',
    addToReference: 'Add to References',
    fullscreenPreview: 'Fullscreen Preview',
    closePreview: 'Close Preview',
    collapseHistory: 'Collapse Right Panel',
    expandHistory: 'Expand Right Panel',
    cancelCompare: 'Remove from Compare',
    compareImage: 'Add to Compare',
    deleteReference: (name) => `Remove ${name}`,
    deleteReferenceShort: 'Remove reference image',
    deleteHistory: 'Delete history image',
    selectAll: 'Select All',
    clearSelection: 'Clear Selection',
    downloadSelected: 'Download Selected',
    historyPersistenceHint: 'History clears on refresh or exit. Save images first.',
    noHistory: 'Generated images will appear here. You can select, download, and compare them.',
    noReference: 'Upload reference images here to include them in the next generation.',
    emptyStateTitle: 'No image yet',
    emptyStateHint: 'Write a prompt to start generating, or upload reference images first.',
    emptyStateGenerating: (count) => `Generating ${count} image(s)`,
    emptyStateAction: 'Start Generating'
  }
};

export function getStoredLocale() {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY);
  return value ? normalizeAppLocale(value) : null;
}

export function getInitialLocale() {
  return getStoredLocale() ?? appConfig.defaultLocale;
}
