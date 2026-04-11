export const appLocaleValues = ['zh', 'en'] as const;

export type AppLocale = (typeof appLocaleValues)[number];

export interface PublicAppConfig {
  apiBaseUrl: string;
  appName: string;
  defaultLocale: AppLocale;
}

export const defaultPublicAppConfig: PublicAppConfig = {
  apiBaseUrl: '/api',
  appName: 'Nano Banana UI',
  defaultLocale: 'zh'
};

export function normalizeAppLocale(value: string | undefined | null): AppLocale {
  if (!value) {
    return defaultPublicAppConfig.defaultLocale;
  }

  return value.toLowerCase().startsWith('en') ? 'en' : 'zh';
}
