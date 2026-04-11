import {
  defaultPublicAppConfig,
  normalizeAppLocale,
  type PublicAppConfig
} from '../../shared/app-config';

declare global {
  interface Window {
    __APP_CONFIG__?: Partial<PublicAppConfig>;
  }
}

const runtimeConfig = window.__APP_CONFIG__ ?? {};

export const appConfig: PublicAppConfig = {
  apiBaseUrl: runtimeConfig.apiBaseUrl?.trim() || defaultPublicAppConfig.apiBaseUrl,
  appName: runtimeConfig.appName?.trim() || defaultPublicAppConfig.appName,
  defaultLocale: normalizeAppLocale(runtimeConfig.defaultLocale)
};

export function resolveApiUrl(pathname: string) {
  const normalizedBase = appConfig.apiBaseUrl.replace(/\/+$/, '');
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${normalizedBase}${normalizedPath}`;
}
